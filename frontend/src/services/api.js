import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

export const apiService = {
  /**
   * Pushes the raw video file binary to the FastAPI landing storage
   */
  uploadVideo: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE}/upload`, formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    });
    return response.data;
  },

  /**
   * Sets up the EventSource loop tracking the FFmpeg audio conversion progress
   */
  trackAudioProgress: (filename, onMessage, onError) => {
    const eventSource = new EventSource(`${API_BASE}/extract-audio-progress/${filename}`);
    
    eventSource.onmessage = (event) => {
      const progress = parseInt(event.data, 10);
      onMessage(progress, eventSource);
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (onError) onError();
    };

    return eventSource;
  },

  /**
   * Tells the AI layer to initiate Whisper transcription and translations
   */
  generateCaptions: async (filename, lang) => {
    const response = await axios.post(`${API_BASE}/generate/${filename}`, { lang });
    return response.data;
  },

  /**
   * Fetches parsed caption timelines from disk
   */
  getCaptions: async (filename, lang) => {
    const response = await axios.get(`${API_BASE}/captions/${filename}/${lang}`);
    return response.data.captions;
  },

  /**
   * Persists updated timeline modifications back to disk storage
   */
  updateCaptions: async (filename, lang, captions) => {
    const response = await axios.put(`${API_BASE}/captions/${filename}/${lang}`, { captions });
    return response.data;
  }
};