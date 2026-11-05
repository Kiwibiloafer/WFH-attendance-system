export const getPhotoUrl = (url?: string | null): string => {
  if (!url) return '';

  const token = localStorage.getItem('token');
  const baseUrl =
    import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  if (!token) return fullUrl;

  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
};

