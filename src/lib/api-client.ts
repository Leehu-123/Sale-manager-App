const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

type ClientSession = {
  user?: {
    accessToken?: string;
  };
};

async function getClientSession(): Promise<ClientSession | null> {
  if (typeof window === 'undefined') return null;

  const response = await fetch('/api/auth/session');
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

async function getHeaders(customHeaders?: HeadersInit) {
  const session = await getClientSession();
  const headers = new Headers(customHeaders);
  
  headers.set('Content-Type', 'application/json');
  
  if (session?.user?.accessToken) {
    headers.set('Authorization', `Bearer ${session.user.accessToken}`);
  }
  
  return headers;
}

async function handleResponse(response: Response) {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json().catch(() => null);
  
  if (!response.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }
  
  return data;
}

export const apiClient = {
  async get(endpoint: string, options?: RequestInit) {
    const headers = await getHeaders(options?.headers);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      method: 'GET',
    });
    return handleResponse(response);
  },

  async post(endpoint: string, body: any, options?: RequestInit) {
    const headers = await getHeaders(options?.headers);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      method: 'POST',
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async put(endpoint: string, body: any, options?: RequestInit) {
    const headers = await getHeaders(options?.headers);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
  
  async patch(endpoint: string, body: any, options?: RequestInit) {
    const headers = await getHeaders(options?.headers);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async delete(endpoint: string, options?: RequestInit) {
    const headers = await getHeaders(options?.headers);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
