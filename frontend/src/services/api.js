import axios from 'axios';

// When using Vite's dev proxy this can stay as ''.
// For production set VITE_API_URL to your backend origin.
const BASE_URL = import.meta.env.VITE_API_URL || '';

const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Attach JWT on every request if present
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('prism_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email, password) => http.post('/api/auth/register', { email, password }),
  login:    (email, password) => http.post('/api/auth/login',    { email, password }),
  me:       ()                => http.get('/api/auth/me'),
};

// ── Songs ─────────────────────────────────────────────────────────────────────
export const songsApi = {
  getDemos:   ()       => http.get('/api/songs/demos'),
  getMySongs: ()       => http.get('/api/songs/my'),
  getSong:    (id)     => http.get(`/api/songs/${id}`),
  deleteSong: (id)     => http.delete(`/api/songs/${id}`),

  upload: (file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return http.post('/api/songs/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
  },
};

/**
 * Convert an absolute server-side file_path to a URL the browser can fetch.
 * The backend mounts /uploads as a static directory.
 */
export function stemUrl(filePath) {
  if (!filePath) return '';
  // Normalise Windows back-slashes
  const norm = filePath.replace(/\\/g, '/');
  const idx  = norm.indexOf('/uploads/');
  if (idx !== -1) return `${BASE_URL}${norm.slice(idx)}`;
  // Fallback: use the explicit files API
  return `${BASE_URL}/api/files/${encodeURIComponent(norm)}`;
}
