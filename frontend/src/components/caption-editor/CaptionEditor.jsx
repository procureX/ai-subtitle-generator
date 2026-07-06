import React from 'react';
import CaptionToolbar from './CaptionToolbar';
import BurnInPanel from './BurnInPanel';
import CaptionTimeline from './CaptionTimeline';

export default function CaptionEditor({
  currentLang,
  onLangChange,
  onSave,
  captionLines,
  onTextChange,
  isSwitching,
  onDownloadSrt,
  onStartBurnIn,
  isBurning,
  burnInProgress,
  burnInStage,
  burnInDownloadUrl,
}) {
  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: '75vh' }}>
      <CaptionToolbar
        currentLang={currentLang}
        onLangChange={onLangChange}
        isSwitching={isSwitching}
        onDownloadSrt={onDownloadSrt}
      />

      <BurnInPanel
        onStartBurnIn={onStartBurnIn}
        isBurning={isBurning}
        burnInProgress={burnInProgress}
        burnInStage={burnInStage}
        burnInDownloadUrl={burnInDownloadUrl}
      />

      <CaptionTimeline
        captionLines={captionLines}
        onTextChange={onTextChange}
        onSave={onSave}
      />
    </div>
  );
}
