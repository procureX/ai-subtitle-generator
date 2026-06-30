import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles } from 'lucide-react';

import VideoUpload from './components/VideoUpload';
import VideoPlayer from './components/VideoPlayer';
import LanguageSelector from './components/LanguageSelector';
import CaptionEditor from './components/CaptionEditor';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [baseFilename, setBaseFilename] = useState('');
  const [currentLang, setCurrentLang] = useState('en');
  const [captionLines, setCaptionLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);

  // Distinct Persistent Percentage Bars States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);

  // AI Script States
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Flow Step 1: Sequential Upload and Progressive Extraction
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      // A. Run file stream to disk destination
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const savedFilename = response.data.filename;
      setBaseFilename(response.data.base_filename);
      setIsExtracting(true);
      setMessage('Network transmission complete. Beginning hardware FFmpeg transcode processing loop...');

      // B. Connect SSE Connection to read backend live calculations output
      const eventSource = new EventSource(`${API_BASE}/extract-audio-progress/${savedFilename}`);
      
      eventSource.onmessage = (event) => {
        const progress = parseInt(event.data, 10);
        setFfmpegProgress(progress);
        
        if (progress >= 100) {
          eventSource.close();
          setIsExtracting(false);
          setLoading(false);
          setMessage('Audio processing complete! Select a workspace target language below.');
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsExtracting(false);
        setLoading(false);
        setMessage('Error occurred mapping sub-process progress loops.');
      };

    } catch (err) {
      setMessage(`System processing failure: ${err.message}`);
      setLoading(false);
    }
  };

  const handleStartAIEngine = async (targetLang) => {
    setIsAiLoading(true);
    setAiProgress(5);
    setAiStage('Booting translation blocks and loading system audio...');
    setMessage('Processing your request...');

    const interval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev < 45) return prev + 3;
        if (prev >= 45 && prev < 85) return prev + 2;
        if (prev >= 85 && prev < 98) return prev + 1;
        return prev;
      });
    }, 400);

    try {
      await axios.post(`${API_BASE}/generate/${baseFilename}`, { lang: targetLang });
      clearInterval(interval);
      setAiProgress(100);
      setAiGenerated(true);
      setMessage('Captions generated successfully!');
      fetchCaptions(baseFilename, targetLang);
    } catch (err) {
      clearInterval(interval);
      setMessage(`AI Engine Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchCaptions = async (filename, lang) => {
    try {
      const response = await axios.get(`${API_BASE}/captions/${filename}/${lang}`);
      setCaptionLines(response.data.captions);
      setCurrentLang(lang);
    } catch (err) {
      setMessage('Error fetching timelines.');
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#090d16', color: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
          <Sparkles color="#38bdf8" fill="#38bdf8" size={24} /> AI Subtitle Studio
        </h1>
      </header>

      {message && (
        <div style={{ background: '#111827', borderLeft: '4px solid #38bdf8', padding: '14px', borderRadius: '4px', marginBottom: '16px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: videoUrl ? '1fr 1fr' : '1fr', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!videoUrl ? (
            <VideoUpload onFileUpload={handleFileUpload} uploadProgress={uploadProgress} />
          ) : (
            <>
              <VideoPlayer videoUrl={videoUrl} videoName={videoFile?.name} />
              
              {/* 📊 BAR 1: Persistent Network Upload */}
              {uploadProgress > 0 && (
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    <span>1. File Upload Status</span>
                    <span style={{ fontWeight: 'bold', color: uploadProgress === 100 ? '#22c55e' : '#38bdf8' }}>
                      {uploadProgress === 100 ? "Uploaded 100%" : `${uploadProgress}%`}
                    </span>
                  </div>
                  <div style={{ width: '100%', background: '#334155', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, background: uploadProgress === 100 ? '#22c55e' : '#38bdf8', height: '100%' }} />
                  </div>
                </div>
              )}

              {/* 📊 BAR 2: Independent Dynamic FFmpeg Extraction Progress */}
              {(isExtracting || ffmpegProgress > 0) && (
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '6px', marginTop: '-4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    <span>2. FFmpeg Audio Extraction</span>
                    <span style={{ fontWeight: 'bold', color: ffmpegProgress === 100 ? '#22c55e' : '#a855f7' }}>
                      {ffmpegProgress}%
                    </span>
                  </div>
                  <div style={{ width: '100%', background: '#334155', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${ffmpegProgress}%`, background: ffmpegProgress === 100 ? '#22c55e' : '#a855f7', height: '100%', transition: 'width 0.3s ease-out' }} />
                  </div>
                </div>
              )}

              {!aiGenerated && !isExtracting && !loading && (
                <LanguageSelector 
                  onStartAI={handleStartAIEngine} 
                  loading={isAiLoading} 
                  aiProgress={aiProgress}
                  aiStage={aiStage}
                />
              )}
            </>
          )}
        </div>

        {aiGenerated && baseFilename && (
          <CaptionEditor 
            currentLang={currentLang}
            onLangChange={(lang) => fetchCaptions(baseFilename, lang)}
            onSave={saveCaptionEdits}
            captionLines={captionLines}
            onTextChange={handleTextChange}
          />
        )}

      </div>
    </div>
  );
}