import { useAuthStore } from '@/stores/authStore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, api } from '../apiClient';

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  let client: ApiClient;
  const mockAuthState = {
    tokens: {
      accessToken: 'mock-token',
      expiresAt: Date.now() + 3600000, // 1 hour from now
    },
    isTokenExpired: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    client = new ApiClient({
      baseURL: 'https://api.test.com',
      timeout: 5000,
      retryAttempts: 1,
    });

    // Reset mocks
    mockFetch.mockClear();
    vi.mocked(useAuthStore.getState).mockReturnValue(mockAuthState);
    mockAuthState.isTokenExpired.mockReturnValue(false);
    mockAuthState.refreshToken.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request with auth token', async () => {
      const mockResponse = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse),
      });

      const _response = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        credentials: 'include',
      });

      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(200);
    });

    it('should handle requests without auth token', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        ...mockAuthState,
        tokens: null,
      });

      const mockResponse = { message: 'public data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse),
      });

      const _response = await client.get('/public');

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      expect(response.data).toEqual(mockResponse);
    });

    it('should refresh expired token automatically', async () => {
      mockAuthState.isTokenExpired.mockReturnValue(true);
      mockAuthState.refreshToken.mockResolvedValue(true);

      // After refresh, return new token
      vi.mocked(useAuthStore.getState)
        .mockReturnValueOnce(mockAuthState) // First call - expired token
        .mockReturnValueOnce({
          // Second call - after refresh
          ...mockAuthState,
          tokens: {
            accessToken: 'new-token',
            expiresAt: Date.now() + 3600000,
          },
        });

      const mockResponse = { data: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse),
      });

      const _response = await client.get('/protected');

      expect(mockAuthState.refreshToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/protected', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer new-token',
        },
        credentials: 'include',
      });
    });
  });

  describe('Error handling', () => {
    it('should handle 401 errors and trigger logout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(client.get('/protected')).rejects.toThrow(ApiError);
      expect(mockAuthState.logout).toHaveBeenCalled();
    });

    it('should create ApiError with detailed information', async () => {
      const errorData = { message: 'Not found', code: 'RESOURCE_NOT_FOUND' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve(errorData),
      });

      try {
        await client.get('/missing');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(404);
        expect(error.statusText).toBe('Not Found');
        expect(error.data).toEqual(errorData);
      }
    });

    it('should handle network errors with retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: () => Promise.resolve({ success: true }),
        });

      const _response = await client.get('/retry-test');
      expect(response.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST requests', () => {
    it('should make POST request with JSON data', async () => {
      const requestData = { name: 'Test', value: 123 };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers(),
        json: () => Promise.resolve(responseData),
      });

      const _response = await client.post('/create', requestData);

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      expect(response.data).toEqual(responseData);
    });
  });

  describe('GraphQL requests', () => {
    it('should make GraphQL request', async () => {
      const query = 'query { user { id name } }';
      const variables = { id: '123' };
      const responseData = { data: { user: { id: '123', name: 'Test' } } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(responseData),
      });

      const result = await client.graphql(query, variables);

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
      });

      expect(result).toEqual(responseData.data);
    });

    it('should handle GraphQL errors', async () => {
      const responseData = {
        data: null,
        errors: [{ message: 'Field error' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(responseData),
      });

      await expect(client.graphql('query { invalid }')).rejects.toThrow(
        'GraphQL errors: Field error'
      );
    });
  });

  describe('File upload', () => {
    it('should upload file with FormData', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const responseData = { id: '123', url: 'https://cdn.test.com/file.txt' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers(),
        json: () => Promise.resolve(responseData),
      });

      const _response = await client.upload('/upload', file, 'document', {
        category: 'test',
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mock-token',
        },
        credentials: 'include',
        body: expect.any(FormData),
      });

      expect(response.data).toEqual(responseData);
    });
  });
});

describe('API convenience methods', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      tokens: { accessToken: 'test-token', expiresAt: Date.now() + 3600000 },
      isTokenExpired: vi.fn().mockReturnValue(false),
      refreshToken: vi.fn().mockResolvedValue(true),
      logout: vi.fn(),
    });
  });

  it('should provide convenient api.get method', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: () => Promise.resolve({ success: true }),
    });

    const _response = await api.get('/test');
    expect(response.data).toEqual({ success: true });
  });

  it('should provide convenient api.post method', async () => {
    const data = { name: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      statusText: 'Created',
      headers: new Headers(),
      json: () => Promise.resolve({ id: 1, ...data }),
    });

    const _response = await api.post('/create', data);
    expect(response.data).toEqual({ id: 1, ...data });
  });
});
