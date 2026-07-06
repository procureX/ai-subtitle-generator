// Single source of truth for the backend base URL. Previously this was
// hardcoded independently in ~8 different places across useVideoWorkspace.js
// (and duplicated again, inconsistently, in the unused api.js).
export const API_BASE = 'http://localhost:8000';
