import { useState } from 'react';
import { API_BASE } from '../constants/api';
import { consumeSSEStream } from '../utils/sse';

/**
 * Burns the current language's captions directly into the video via ffmpeg,
 * streaming progress over SSE, then exposes a download/preview URL for the result.
 */
export default function useBurnIn({ baseFilename, currentLang, setMessage }) {
  const [isBurning, setIsBurning] = useState(false);
  const [burnInProgress, setBurnInProgress] = useState(0);
  const [burnInStage, setBurnInStage] = useState('');
  const [burnInDownloadUrl, setBurnInDownloadUrl] = useState(null);

  const startBurnIn = async () => {
    if (!baseFilename || !currentLang) return;

    setIsBurning(true);
    setBurnInProgress(0);
    setBurnInStage('Connecting to render engine...');
    setBurnInDownloadUrl(null);

    let pipelineFailed = false;

    try {
      const url = `${API_BASE}/burn-in/${encodeURIComponent(baseFilename)}/${encodeURIComponent(currentLang)}`;
      const response = await fetch(url, { method: 'POST' });

      if (!response.ok) throw new Error('Burn-in request rejected by server.');

      await consumeSSEStream(response, (eventName, dataVal) => {
        if (eventName === 'burn_in_progress') {
          setBurnInProgress(parseInt(dataVal, 10));
          setBurnInStage('Rendering hardcoded captions onto video...');
        } else if (eventName === 'burn_in_complete') {
          setBurnInProgress(100);
          setBurnInStage('Burned-in video ready!');
          setBurnInDownloadUrl(`${API_BASE}/download-video/${dataVal}`);
        } else if (eventName === 'error') {
          pipelineFailed = true;
          setBurnInStage(`Burn-in failed: ${dataVal}`);
        }
      });

      if (pipelineFailed) {
        setMessage('Burn-in failed — check the backend console for details.');
      }
    } catch (err) {
      console.error(err);
      setBurnInStage(`Burn-in interruption: ${err.message}`);
    } finally {
      setIsBurning(false);
    }
  };

  return {
    isBurning,
    burnInProgress,
    burnInStage,
    burnInDownloadUrl,
    startBurnIn,
  };
}
