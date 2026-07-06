import React from 'react';
import { Flame, Download, Loader } from 'lucide-react';

export default function BurnInPanel({ onStartBurnIn, isBurning, burnInProgress, burnInStage, burnInDownloadUrl }) {
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '14px', marginBottom: '16px' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '14px', fontWeight: '600' }}>
          <Flame size={16} color="#fb923c" /> Burn Captions Into Video
        </div>
        <button
          onClick={onStartBurnIn}
          disabled={isBurning}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isBurning ? '#475569' : '#ea580c', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: isBurning ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          {isBurning ? <Loader size={14} className="spin" /> : <Flame size={14} />}
          {isBurning ? 'Burning In...' : 'Burn In Captions'}
        </button>
      </div>

      {isBurning && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ color: '#fb923c', fontWeight: '500' }}>🔥 {burnInStage || 'Rendering hardcoded captions onto video...'}</span>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{burnInProgress}%</span>
          </div>
          <div style={{ width: '100%', background: '#334155', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${burnInProgress}%`, background: '#ea580c', height: '100%', transition: 'width 0.3s ease-out' }} />
          </div>
        </div>
      )}

      {burnInDownloadUrl && !isBurning && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <video
            src={burnInDownloadUrl}
            controls
            style={{ width: '100%', borderRadius: '4px', display: 'block', background: '#000' }}
          />
          <a
            href={burnInDownloadUrl}
            download
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#166534', color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}
          >
            <Download size={16} /> Download Burned Video
          </a>
        </div>
      )}
    </div>
  );
}
