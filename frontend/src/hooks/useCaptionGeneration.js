import { useState } from 'react';
import { API_BASE } from '../constants/api';
import { consumeSSEStream } from '../utils/sse';

/**
 * Runs the Whisper transcription + translation pipeline for a given target
 * language, tracking progress for both stages independently.
 *
 * `runGeneration` returns true/false so callers (e.g. the caption editor's
 * language switcher) know whether it's safe to fetch the resulting captions.
 */
export default function useCaptionGeneration({ baseFilename, setCurrentLang, setMessage }) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [translateProgress, setTranslateProgress] = useState(0);
  // Tracks which languages actually have an .srt file on disk for this video
  const [generatedLangs, setGeneratedLangs] = useState(new Set());

  const resetGeneration = () => {
    setAiGenerated(false);
    setTranscribeProgress(0);
    setTranslateProgress(0);
    setGeneratedLangs(new Set());
  };

  const runGeneration = async (targetLanguage) => {
    if (!baseFilename) return false;

    setIsAiLoading(true);
    setCurrentLang(targetLanguage);
    setTranscribeProgress(0);
    setTranslateProgress(0);
    setMessage('Connecting to AI Generation Engine Pipeline...');

    let pipelineFailed = false;

    try {
      const url = `${API_BASE}/generate/${baseFilename}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: targetLanguage }),
      });

      if (!response.ok) throw new Error('AI pipeline rejected generation parameters.');

      await consumeSSEStream(response, (eventName, dataVal) => {
        if (eventName === 'transcription_start' || eventName === 'translation_start') {
          setMessage(dataVal);
        } else if (eventName === 'transcription_progress') {
          // Whisper's per-segment percentage is derived from segment.end / total_duration,
          // which truncates to 0 for short early segments in a long video — clamping to
          // never decrease avoids any visible backward flicker in the progress bar.
          setTranscribeProgress((prev) => Math.max(prev, parseInt(dataVal, 10)));
        } else if (eventName === 'transcription_complete') {
          setTranscribeProgress(100);
        } else if (eventName === 'translation_progress') {
          setTranslateProgress(parseInt(dataVal, 10));
        } else if (eventName === 'translation_complete') {
          setTranslateProgress(100);
        } else if (eventName === 'error') {
          pipelineFailed = true;
          setMessage(`Engine breakdown: ${dataVal}`);
        }
      });

      if (pipelineFailed) return false;

      setTranscribeProgress(100);
      if (targetLanguage !== 'en') setTranslateProgress(100);

      setMessage('AI processing cycles successfully completed! Rendering layout matrices...');
      // Whisper always produces an English transcript regardless of target,
      // plus the target language itself (translation is skipped if target === 'en').
      setGeneratedLangs((prev) => new Set(prev).add('en').add(targetLanguage));
      setAiGenerated(true);
      return true;
    } catch (err) {
      console.error(err);
      setMessage(`AI Pipeline Interruption: ${err.message}`);
      return false;
    } finally {
      setIsAiLoading(false);
    }
  };

  return {
    isAiLoading,
    aiGenerated,
    transcribeProgress,
    translateProgress,
    generatedLangs,
    runGeneration,
    resetGeneration,
  };
}
