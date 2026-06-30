import { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';

export default function useVideoWorkspace() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [baseFilename, setBaseFilename] = useState('');
  const [currentLang, setCurrentLang] = useState('en');
  const [captionLines, setCaptionLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);

  // Consolidated Pipeline Progress Tracking States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Use a mutable ref container to persist the tracking timer across render states safely
  const aiIntervalRef = useRef(null);

  // Lifecycle garbage collection cleanup: Kills background tasks if components unmount
  useEffect(() => {
    return () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, []);

  // Execution Flow 1: File Storage and SSE Streaming Pipeline Interception
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setLoading(true);
    setUploadProgress(1);
    setFfmpegProgress(0);
    setIsExtracting(false);
    setMessage('Uploading media payload to core storage...');

    try {
      const uploadData = await apiService.uploadVideo(file, (percent) => {
        setUploadProgress(percent);
      });

      setIsExtracting(true);
      setMessage('Network transmission complete. Beginning hardware FFmpeg transcode processing loop...');

      apiService.trackAudioProgress(
        uploadData.filename,
        (progress, eventSource) => {
          setFfmpegProgress(progress);
          if (progress >= 100) {
            eventSource.close();
            setIsExtracting(false);
            setLoading(false);
            setMessage('Audio processing complete! Select a workspace target language below.');
          }
        },
        () => {
          setIsExtracting(false);
          setLoading(false);
          setMessage('Error occurred mapping sub-process progress loops.');
        }
      );

    } catch (err) {
      setMessage(`System processing failure: ${err.message}`);
      setLoading(false);
    }
  };

  // Execution Flow 2: Trigger Whisper AI & Safe Simulation Interpolation
  const handleStartAIEngine = async (targetLang) => {
    // Standard defensive code: Clear lingering timers before spinning up a new one
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);

    setIsAiLoading(true);
    setAiProgress(5);
    setAiStage('Booting translation blocks and loading system audio...');
    setMessage('Processing your request...');

    aiIntervalRef.current = setInterval(() => {
      setAiProgress((prev) => {
        if (prev < 45) return prev + 3;
        if (prev >= 45 && prev < 85) return prev + 2;
        if (prev >= 85 && prev < 98) return prev + 1;
        return prev;
      });
    }, 400);

    try {
      await apiService.generateCaptions(baseFilename, targetLang);
      
      clearInterval(aiIntervalRef.current);
      setAiProgress(100);
      setAiStage('Processing complete!');
      setAiGenerated(true);
      setMessage('Captions generated successfully!');
      
      const captions = await apiService.getCaptions(baseFilename, targetLang);
      setCaptionLines(captions);
      setCurrentLang(targetLang);
    } catch (err) {
      clearInterval(aiIntervalRef.current);
      setAiProgress(0);
      setAiStage('');
      setMessage(`AI Engine Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchCaptions = async (filename, lang) => {
    try {
      const captions = await apiService.getCaptions(filename, lang);
      setCaptionLines(captions);
      setCurrentLang(lang);
    } catch (err) {
      setMessage('Error fetching timelines.');
    }
  };

  const handleTextChange = (index, newText) => {
    const updated = [...captionLines];
    updated[index].text = newText;
    setCaptionLines(updated);
  };

  const saveCaptionEdits = async () => {
    if (!baseFilename) return;
    try {
      setMessage('Committing changes safely to file system...');
      const result = await apiService.updateCaptions(baseFilename, currentLang, captionLines);
      setMessage(result.message || 'Successfully updated!');
    } catch (err) {
      setMessage('Error updating disk entities.');
    }
  };

  return {
    videoFile, videoUrl, baseFilename, currentLang, captionLines, loading, message, aiGenerated,
    uploadProgress, ffmpegProgress, isExtracting, aiProgress, aiStage, isAiLoading,
    handleFileUpload, handleStartAIEngine, fetchCaptions, handleTextChange, saveCaptionEdits
  };
}