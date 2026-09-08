export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const fetchApi = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem('pydahsoft_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg = data.error?.message || data.message || `Request failed with status ${response.status}`;
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('pydahsoft_token');
      sessionStorage.removeItem('pydahsoft_user');
      window.dispatchEvent(new Event('pydahsoft:session-expired'));
    }
    throw new Error(errorMsg);
  }

  return data;
};
