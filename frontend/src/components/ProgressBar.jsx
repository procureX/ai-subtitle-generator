import React from 'react';

export default function ProgressBar({ title, percentage, activeColor, isComplete }) {
  const finalColor = isComplete ? '#22c55e' : activeColor;
  
  return (
    <div style={{ background: '#1e293b', padding: '14px', borderRadius: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
        <span>{title}</span>
        <span style={{ fontWeight: 'bold', color: finalColor }}>
          {isComplete ? "Complete 100%" : `${percentage}%`}
        </span>
      </div>
      <div style={{ width: '100%', background: '#334155', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${percentage}%`, 
          background: finalColor, 
          height: '100%', 
          transition: 'width 0.25s ease-out, background-color 0.2s ease' 
        }} />
      </div>
    </div>
  );
}