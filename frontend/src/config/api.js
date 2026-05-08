const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const rawDocsUrl = (import.meta.env.VITE_API_DOCS_URL || '').trim();

export const API_BASE_URL = rawApiBase;
export const API_DOCS_URL = rawDocsUrl || (rawApiBase ? `${rawApiBase}/docs` : 'http://localhost:8000/docs');

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}
