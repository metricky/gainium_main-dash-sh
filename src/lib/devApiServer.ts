import { ThemeMode, type User } from '@/types/auth';
import { jwtDecode } from 'jwt-decode';
import { logger } from './loggerInstance';

// Mock user data for development
const mockUser: User = {
  id: '6279d23c6bf516d657d1ad0c',
  email: 'user@gainium.io',
  name: 'Test User',
  hasExchanges: true,
  hasPaperExchanges: true,
  hasLiveExchanges: false,
  bigAccount: false,
  timezone: 'UTC',
  demo: false,
  theme: ThemeMode.Dark,
  weekStart: 'm',
  lastName: 'User',
  nickname: 'Tester',
  picture: 'https://i.pravatar.cc/150?img=3',
  balance: 1000,
  subscription: {
    subscriptionPlanName: 'advanced',
    type: 'monthly',
    nextPayment: {
      subscriptionPlanName: 'advanced',
      type: 'monthly',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    startDate: new Date().toISOString(),
    automaticCharge: true,
    price: 29.99,
    status: 'active',
  },
  onboardingSteps: {
    signup: true,
    liveExchange: false,
    deployLiveBot: false,
    earnProfit: false,
  },
  paperContext: true,
  affiliate: {
    affiliateId: 'abc123',
    totalBonuses: 150,
    freezeAmount: 0,
    affiliateLevel: 2,
    recentReferrals: 5,
    walletProtocol: 'ethereum',
    walletToWithdraw: '0x1234567890abcdef1234567890abcdef12345678',
    autoWithdraw: true,
    affiliateValid: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
  },
  notifications: null,
};

// Generate a mock JWT token
function generateMockToken(user: User): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  };

  // Simple base64 encoding for mock token (not cryptographically secure)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  return `${encodedHeader}.${encodedPayload}.mock_signature`;
}

// Mock API handlers
export const mockApiHandlers = {
  '/auth/login': async (req: Request): Promise<Response> => {
    try {
      const body = await req.json();
      const { email, password } = body;

      // Simple validation
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Mock login logic (accept any email/password for development)
      const user = { ...mockUser, email };
      const accessToken = generateMockToken(user);

      return new Response(
        JSON.stringify({
          accessToken,
          user,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie':
              'refreshToken=mock_refresh_token; HttpOnly; Path=/; Max-Age=604800', // 7 days
          },
        }
      );
    } catch (_error) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  '/auth/google': async (req: Request): Promise<Response> => {
    try {
      const body = await req.json();
      const { googleToken } = body;

      if (!googleToken) {
        return new Response(
          JSON.stringify({ error: 'Google token is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Decode the Google token to get user info
      try {
        const googlePayload = jwtDecode<{
          sub: string;
          email: string;
          name: string;
          picture?: string;
        }>(googleToken);

        const avatarUrl = googlePayload.picture;
        const user: User = {
          ...mockUser,
          id: googlePayload.sub,
          email: googlePayload.email,
          name: googlePayload.name,
          ...(avatarUrl && { avatar: avatarUrl }),
        };

        const accessToken = generateMockToken(user);

        return new Response(
          JSON.stringify({
            accessToken,
            user,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie':
                'refreshToken=mock_refresh_token; HttpOnly; Path=/; Max-Age=604800', // 7 days
            },
          }
        );
      } catch (_error) {
        return new Response(JSON.stringify({ error: 'Invalid Google token' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (_error) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  '/auth/refresh': async (req: Request): Promise<Response> => {
    // Check for refresh token in cookies
    const cookies = req.headers.get('cookie');
    const hasRefreshToken = cookies?.includes(
      'refreshToken=mock_refresh_token'
    );

    if (!hasRefreshToken) {
      return new Response(
        JSON.stringify({ error: 'No refresh token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate new access token
    const accessToken = generateMockToken(mockUser);

    return new Response(
      JSON.stringify({
        accessToken,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie':
            'refreshToken=mock_refresh_token; HttpOnly; Path=/; Max-Age=604800', // 7 days
        },
      }
    );
  },

  '/auth/logout': async (_req: Request): Promise<Response> => {
    return new Response(
      JSON.stringify({ message: 'Logged out successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'refreshToken=; HttpOnly; Path=/; Max-Age=0', // Clear refresh token
        },
      }
    );
  },

  '/health': async (_req: Request): Promise<Response> => {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Mock API server is running',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  },
};

// Check if we're in development mode and add API middleware
if (import.meta.env.MODE === 'development') {
  logger.info('🔧 Mock API server enabled for development');

  // Intercept fetch requests to API endpoints
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    // Check if this is a request to our mock API
    if (
      url.includes('localhost:7500/auth/') ||
      url.includes('localhost:7500/health')
    ) {
      const path = new URL(url).pathname;
      const handler = mockApiHandlers[path as keyof typeof mockApiHandlers];

      if (handler) {
        logger.info(
          `🔄 Intercepting API request: ${init?.method || 'GET'} ${path}`
        );
        const request = new Request(url, init);
        return handler(request);
      }
    }

    // Use original fetch for all other requests
    return originalFetch(input, init);
  };
}
