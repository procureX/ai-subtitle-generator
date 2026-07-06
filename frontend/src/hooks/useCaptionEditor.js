import { useState } from 'react';
import { API_BASE } from '../constants/api';

/**
 * Owns the caption timeline: fetching, editing, saving, and exporting, plus
 * on-demand language switching (generating a language track the first time
 * it's requested rather than assuming it already exists on disk).
 */
export default function useCaptionEditor({
  baseFilename,
  currentLang,
  setCurrentLang,
  generatedLangs,
  runGeneration,
  setMessage,
}) {
  const [captionLines, setCaptionLines] = useState([]);

  const resetCaptions = () => setCaptionLines([]);

  const fetchCaptions = async (filename, lang) => {
    try {
      const res = await fetch(`${API_BASE}/captions/${filename}/${lang}`);
      if (!res.ok) throw new Error('Requested caption block is missing from filesystem storage.');
      const data = await res.json();
      setCaptionLines(data.captions);
      setCurrentLang(lang);
    } catch (err) {
      setMessage(`Failed fetching language blocks: ${err.message}`);
    }
  };

  // Switches the caption editor's active language, generating it first if it
  // doesn't exist on disk yet.
  const switchLanguage = async (lang) => {
    if (generatedLangs.has(lang)) {
      await fetchCaptions(baseFilename, lang);
      return;
    }
    const success = await runGeneration(lang);
    if (success) {
      await fetchCaptions(baseFilename, lang);
    }
  };

  // NOTE: `position` here is the caption's position in the array (0-based),
  // not the subtitle's own `.index` field from the .srt file (1-based).
  // The previous version of this function matched on `line.index === index`
  // where `index` was actually the array position — since srt indices start
  // at 1, that comparison never matched the first line (so its edits were
  // silently dropped) and matched every other line one row too early
  // (so edits landed on the wrong caption). Matching by array position fixes
  // both issues.
  const handleTextChange = (position, updatedText) => {
    setCaptionLines((prev) =>
      prev.map((line, i) => (i === position ? { ...line, text: updatedText } : line))
    );
  };

  const saveCaptionEdits = async () => {
    try {
      const res = await fetch(`${API_BASE}/captions/${baseFilename}/${currentLang}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captions: captionLines }),
      });
      if (!res.ok) throw new Error('Server storage rejected patch array payload update.');
      setMessage('All text layer changes successfully written back to system storage!');
    } catch (err) {
      setMessage(`Failed committing layout edits: ${err.message}`);
    }
  };

  const downloadSrt = () => {
    if (!baseFilename || !currentLang) return;
    const url = `${API_BASE}/captions/${encodeURIComponent(baseFilename)}/${encodeURIComponent(currentLang)}/download`;
    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    captionLines,
    fetchCaptions,
    switchLanguage,
    handleTextChange,
    saveCaptionEdits,
    downloadSrt,
    resetCaptions,
  };
}
