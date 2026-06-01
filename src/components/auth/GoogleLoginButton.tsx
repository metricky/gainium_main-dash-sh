import { apiClient } from '@/lib/apiClient';
import { RealAuthService } from '@/lib/realAuthService';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import React from 'react';

interface GoogleLoginButtonProps {
  /**
   * Callback function called when login is successful
   */
  onSuccess?: () => void;
  /**
   * Callback function called when login fails
   * @param error - Error message describing the failure
   */
  onError?: (error: string) => void;
  /**
   * Callback function called when 2FA is required
   * @param temporaryToken - Temporary token for 2FA authentication
   */
  onOTPRequired?: (temporaryToken: string) => void;
  /**
   * Custom class name for styling
   */
  className?: string;
  /**
   * Whether to show the Google One Tap prompt
   */
  useOneTap?: boolean;
  /**
   * Whether to enable auto-select for the user
   */
  autoSelect?: boolean;
  /**
   * Whether terms have been accepted
   */
  termsAccepted?: boolean;
  /**
   * Whether the button should be disabled
   */
  disabled?: boolean;
}

interface GoogleJwtPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

interface GoogleAuthResponse {
  accessToken: string;
  user: User;
}

interface OTPRequiredError extends Error {
  temporaryToken?: string;
}

/**
 * Google OAuth login button component
 *
 * This component integrates with Google OAuth2 for authentication.
 * On successful Google authentication, it sends the Google token to the backend
 * `/auth/google` endpoint and handles the response by updating the auth store.
 *
 * @example
 * ```tsx
 * <GoogleLoginButton
 *   onSuccess={() => navigate('/overview')}
 *   onError={(error) => setError(error)}
 * />
 * ```
 */
export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  onOTPRequired,
  className,
  useOneTap = false,
  autoSelect = false,
  termsAccepted = false,
  disabled = false,
}) => {
  const { login, setLoading } = useAuthStore();

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    try {
      if (disabled || !termsAccepted) {
        onError?.('Please accept the terms and conditions to continue.');
        return;
      }

      setLoading(true);

      // Validate the credential response
      if (!credentialResponse?.credential) {
        throw new Error('No credential received from Google');
      }

      // Decode the Google JWT to get user info (for validation only)
      let googlePayload: GoogleJwtPayload;
      try {
        googlePayload = jwtDecode<GoogleJwtPayload>(
          credentialResponse.credential
        );
      } catch (decodeError) {
        console.error('Failed to decode Google JWT:', decodeError);
        throw new Error('Invalid Google credential format');
      }

      // Validate essential fields are present
      if (!googlePayload.sub || !googlePayload.email || !googlePayload.name) {
        throw new Error('Missing required user information from Google');
      }

      let authResponse: GoogleAuthResponse;

      // Use real or mock authentication based on environment
      if (
        import.meta.env.MODE === 'development' &&
        import.meta.env.VITE_USE_MOCK_AUTH !== 'false'
      ) {
        // Mock Google authentication for development
        const response = await apiClient.post<GoogleAuthResponse>(
          '/auth/google',
          {
            googleToken: credentialResponse.credential,
          }
        );

        if (!response.data.accessToken || !response.data.user) {
          throw new Error('Invalid response from authentication server');
        }

        authResponse = response.data;
      } else {
        // Real Google authentication using GraphQL
        authResponse = await RealAuthService.loginWithGoogle(
          credentialResponse.credential
        );
      }

      // Update auth state with the tokens and user info from backend
      login(authResponse.accessToken, authResponse.user);

      // Call success callback
      onSuccess?.();
    } catch (error) {
      console.error('Google login failed:', error);

      // Handle OTP_REQUIRED error specially
      if (error instanceof Error && error.message === 'OTP_REQUIRED') {
        const otpError = error as OTPRequiredError;
        if (otpError.temporaryToken && onOTPRequired) {
          onOTPRequired(otpError.temporaryToken);
          return; // Don't call onError, just trigger 2FA flow
        } else {
          onError?.(
            'Two-factor authentication is required, but no temporary token was provided.'
          );
          return;
        }
      }

      // Determine appropriate error message
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'Login failed. Please try again.';
      }

      // Call error callback
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Google login was cancelled or failed';
    console.error(errorMessage);
    onError?.(errorMessage);
  };

  return (
    <div className={className}>
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={useOneTap}
          auto_select={autoSelect}
          theme="filled_black"
          size="large"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
          width="100%"
          containerProps={{
            style: {
              height: '48px', // h-12
              borderRadius: '6px',
            },
          }}
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;
