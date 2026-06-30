import React from 'react';
import { Sparkles } from 'lucide-react';

// Core UI Workspace Layout Components
import VideoUpload from './components/VideoUpload';
import VideoPlayer from './components/VideoPlayer';
import LanguageSelector from './components/LanguageSelector';
import CaptionEditor from './components/CaptionEditor';

// Modular Progress Meter Component
import ProgressBar from './components/ProgressBar';

// Custom State Hook Extraction
import useVideoWorkspace from './hooks/useVideoWorkspace';

export default function App() {
  // Destructure state machine boundaries cleanly from the abstracted custom hook
  const {
    videoFile,
    videoUrl,
    baseFilename,
    currentLang,
    captionLines,
    loading,
    message,
    aiGenerated,
    uploadProgress,
    ffmpegProgress,
    isExtracting,
    aiProgress,
    aiStage,
    isAiLoading,
    handleFileUpload,
    handleStartAIEngine,
    fetchCaptions,
    handleTextChange,
    saveCaptionEdits
  } = useVideoWorkspace();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#090d16', color: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      
      {/* 🎬 HEADER BRANDING BLOCK */}
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
          <Sparkles color="#38bdf8" fill="#38bdf8" size={24} /> AI Subtitle Studio
        </h1>
      </header>

      {/* 🔔 GLOBAL SYSTEM EVENT ALERT NOTIFICATION BANNER */}
      {message && (
        <div style={{ background: '#111827', borderLeft: '4px solid #38bdf8', padding: '14px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* 🎛️ CORE INTERACTIVE WORKSPACE LAYOUT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: videoUrl ? '1fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Media Feed and Core Status Monitors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!videoUrl ? (
            <VideoUpload onFileUpload={handleFileUpload} uploadProgress={uploadProgress} />
          ) : (
            <>
              {/* Local File Media Canvas Player Component */}
              <VideoPlayer videoUrl={videoUrl} videoName={videoFile?.name} />
              
              {/* 📊 METER 1: Persistent Network File Upload Track */}
              {uploadProgress > 0 && (
                <ProgressBar 
                  title="1. File Upload Status" 
                  percentage={uploadProgress} 
                  activeColor="#38bdf8" 
                  isComplete={uploadProgress === 100}
                />
              )}

              {/* 📊 METER 2: Independent Hardware FFmpeg Conversion Track */}
              {(isExtracting || ffmpegProgress > 0) && (
                <ProgressBar 
                  title="2. FFmpeg Audio Extraction" 
                  percentage={ffmpegProgress} 
                  activeColor="#a855f7" 
                  isComplete={ffmpegProgress === 100}
                />
              )}

              {/* Configurations Control Block Panel */}
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

        {/* RIGHT COLUMN: Interactive Subtitle Translation Workspace Editor Grid */}
        {aiGenerated && baseFilename && (
          <div style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', background: '#111827', borderRadius: '8px', border: '1px solid #1e293b', padding: '4px' }}>
            <CaptionEditor 
              currentLang={currentLang}
              onLangChange={(lang) => fetchCaptions(baseFilename, lang)}
              onSave={saveCaptionEdits}
              captionLines={captionLines}
              onTextChange={handleTextChange}
            />
          </div>
        )}

      </div>
    </div>
  );
}