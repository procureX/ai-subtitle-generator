import React, { useState } from 'react';
import { Save, ChevronDown, ChevronUp, ListVideo } from 'lucide-react';
import CaptionLine from './CaptionLine';

export default function CaptionTimeline({ captionLines, onTextChange, onSave }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '12px 14px',
            color: '#f1f5f9',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListVideo size={16} color="#38bdf8" />
            Caption Timeline ({captionLines.length} lines)
          </span>
          {isOpen ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
        </button>

        <button
          onClick={onSave}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          <Save size={16} /> Save Timeline Edits
        </button>
      </div>

      {isOpen && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginTop: '12px' }}>
          {captionLines.map((line, position) => (
            <CaptionLine
              key={line.index}
              line={line}
              onTextChange={(text) => onTextChange(position, text)}
            />
          ))}
        </div>
      )}
    </>
  );
}
