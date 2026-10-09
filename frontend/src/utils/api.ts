export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('unlost_token');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem('unlost_token', token);
    } else {
      localStorage.removeItem('unlost_token');
    }
  } catch {}
};

export const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials || 'include',
  });
};
