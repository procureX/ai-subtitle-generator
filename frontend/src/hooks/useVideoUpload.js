import { useState } from 'react';
import { API_BASE } from '../constants/api';

/**
 * Handles video upload and the ffmpeg audio-extraction stage that starts
 * automatically once the upload completes.
 *
 * `onUploaded(baseFilename)` is called on success so the parent composer can
 * update shared state (like resetting caption/generation state for the new video).
 */
export default function useVideoUpload({ onUploaded, setMessage }) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setLoading(true);
    setUploadProgress(1);
    setFfmpegProgress(0);
    setMessage('Uploading media payload to core storage...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct XHR/Fetch approach to guarantee upload progress visibility
      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload status failed on server side.'));
          }
        };
        xhr.onerror = () => reject(new Error('Network context error.'));
        xhr.send(formData);
      });

      onUploaded(response.base_filename);
      setIsExtracting(true);
      setMessage('Network transmission complete. Running hardware FFmpeg transcode loop...');

      // Establish SSE connection stream for audio extraction monitoring
      const audioSSE = new EventSource(`${API_BASE}/extract-audio-progress/${response.filename}`);

      audioSSE.onmessage = (event) => {
        const progress = parseInt(event.data, 10);
        setFfmpegProgress(progress);
        if (progress >= 100) {
          audioSSE.close();
          setIsExtracting(false);
          setLoading(false);
          setMessage('Audio track compilation complete! Select target language parameters below.');
        }
      };

      audioSSE.onerror = () => {
        audioSSE.close();
        setIsExtracting(false);
        setLoading(false);
        setMessage('Error occurred tracking background transcode tasks.');
      };
    } catch (err) {
      console.error(err);
      setMessage(`Workflow breakdown: ${err.message}`);
      setLoading(false);
    }
  };

  return {
    videoFile,
    videoUrl,
    uploadProgress,
    ffmpegProgress,
    isExtracting,
    loading,
    handleFileUpload,
  };
}
