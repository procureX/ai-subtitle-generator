import { useState } from 'react';
import useVideoUpload from './useVideoUpload';
import useCaptionGeneration from './useCaptionGeneration';
import useCaptionEditor from './useCaptionEditor';
import useBurnIn from './useBurnIn';

/**
 * Composes the four focused workspace hooks into a single interface for
 * App.jsx. This used to be one large hook doing all of upload, generation,
 * caption editing, and burn-in directly; those concerns now live in their
 * own files (see ./useVideoUpload, ./useCaptionGeneration,
 * ./useCaptionEditor, ./useBurnIn) and this file just wires shared state
 * (baseFilename, currentLang, message) between them.
 */
export default function useVideoWorkspace() {
  const [baseFilename, setBaseFilename] = useState('');
  const [currentLang, setCurrentLang] = useState('en');
  const [message, setMessage] = useState('');

  const generation = useCaptionGeneration({ baseFilename, setCurrentLang, setMessage });

  const captionEditor = useCaptionEditor({
    baseFilename,
    currentLang,
    setCurrentLang,
    generatedLangs: generation.generatedLangs,
    runGeneration: generation.runGeneration,
    setMessage,
  });

  const upload = useVideoUpload({
    setMessage,
    onUploaded: (filename) => {
      setBaseFilename(filename);
      generation.resetGeneration();
      captionEditor.resetCaptions();
    },
  });

  const burnIn = useBurnIn({ baseFilename, currentLang, setMessage });

  // Resets the entire workspace back to the initial upload screen so the
  // person can subtitle another video without refreshing the page.
  const subtitleAnotherVideo = () => {
    upload.resetUpload();
    generation.resetGeneration();
    captionEditor.resetCaptions();
    burnIn.resetBurnIn();
    setBaseFilename('');
    setCurrentLang('en');
    setMessage('');
  };

  return {
    videoFile: upload.videoFile,
    videoUrl: upload.videoUrl,
    baseFilename,
    currentLang,
    captionLines: captionEditor.captionLines,
    loading: upload.loading,
    message,
    aiGenerated: generation.aiGenerated,
    uploadProgress: upload.uploadProgress,
    ffmpegProgress: upload.ffmpegProgress,
    isExtracting: upload.isExtracting,
    transcribeProgress: generation.transcribeProgress,
    translateProgress: generation.translateProgress,
    isAiLoading: generation.isAiLoading,
    generatedLangs: generation.generatedLangs,
    isBurning: burnIn.isBurning,
    burnInProgress: burnIn.burnInProgress,
    burnInStage: burnIn.burnInStage,
    burnInDownloadUrl: burnIn.burnInDownloadUrl,
    handleFileUpload: upload.handleFileUpload,
    // The initial "Generate AI Captions" button and the caption editor's
    // language switcher both need identical behavior on a fresh language
    // (nothing generated yet -> generate, then fetch) so both are wired to
    // the same function.
    handleStartAIEngine: captionEditor.switchLanguage,
    fetchCaptions: captionEditor.fetchCaptions,
    switchLanguage: captionEditor.switchLanguage,
    handleTextChange: captionEditor.handleTextChange,
    saveCaptionEdits: captionEditor.saveCaptionEdits,
    downloadSrt: captionEditor.downloadSrt,
    startBurnIn: burnIn.startBurnIn,
    subtitleAnotherVideo,
  };
}
