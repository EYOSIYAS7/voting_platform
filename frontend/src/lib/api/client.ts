/**
 * API Client for INSA E-Voting Platform
 * Communicates with the NestJS backend on http://localhost:3001
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClientError extends Error {
  statusCode: number;
  error?: string;
  details?: unknown;

  constructor(statusCode: number, message: string, error?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('insa_access_token');
  }

  setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('insa_access_token', token);
    } else {
      localStorage.removeItem('insa_access_token');
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuth, headers = {}, ...rest } = options;
    const url = this.buildUrl(path, params);

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        reqHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...rest,
        headers: reqHeaders,
      });

      // 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      let data: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : null;
      }

      if (!response.ok) {
        const message =
          (Array.isArray(data?.message) ? data.message.join(', ') : data?.message) ||
          response.statusText ||
          'API Request failed';

        // Auto clean token if unauthorized
        if (response.status === 401 && !path.includes('/auth/login')) {
          this.setToken(null);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('insa:unauthorized'));
          }
        }

        throw new ApiClientError(
          response.status,
          message,
          data?.error,
          data
        );
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        throw err;
      }
      throw new ApiClientError(
        500,
        err.message || 'Network error connecting to backend service'
      );
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
