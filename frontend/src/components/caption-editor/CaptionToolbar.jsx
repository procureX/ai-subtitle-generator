import React from 'react';
import { Globe, FileDown } from 'lucide-react';
import { LANGUAGES } from '../../constants/languages';

export default function CaptionToolbar({ currentLang, onLangChange, isSwitching, onDownloadSrt }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Globe size={18} color="#38bdf8" />
        <select
          value={currentLang}
          onChange={(e) => onLangChange(e.target.value)}
          disabled={isSwitching}
          style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '6px 12px', borderRadius: '4px', cursor: isSwitching ? 'not-allowed' : 'pointer' }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onDownloadSrt}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', color: '#f1f5f9', border: '1px solid #475569', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
        >
          <FileDown size={14} /> Download .srt
        </button>
      </div>
    </div>
  );
}
