import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraphQLClient } from '@/lib/api/GraphQLClient';
import { logger } from '@/lib/loggerInstance';
import { RealAuthService } from '@/lib/realAuthService';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Clipboard, Shield } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TwoFactorAuthProps {
  temporaryToken: string;
  onBack?: () => void;
}

interface ValidateOTPResponse {
  validateOTP: {
    status: 'OK' | 'NOTOK';
    reason?: string;
    data?: {
      token: string;
      isOTP?: boolean;
    };
  };
}

interface ValidateRecoveryCodeResponse {
  validateRecoveryCode: {
    status: 'OK' | 'NOTOK';
    reason?: string;
    data?: {
      token: string;
    };
  };
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  temporaryToken,
  onBack,
}) => {
  const navigate = useNavigate();
  const { login, setLoading } = useAuthStore();
  const [otpCode, setOtpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference to the OTP input for auto-focus
  const otpInputRef = useRef<HTMLInputElement>(null);
  const recoveryInputRef = useRef<HTMLInputElement>(null);

  // GraphQL client for API calls
  const graphQLClient = useRef(
    new GraphQLClient(
      import.meta.env.VITE_API_ENDPOINT || 'https://api.gainium.io',
      temporaryToken
    )
  );

  // Focus the appropriate input when the component mounts or mode changes
  useEffect(() => {
    if (showRecoveryCode && recoveryInputRef.current) {
      recoveryInputRef.current.focus();
    } else if (!showRecoveryCode && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showRecoveryCode]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(
    async (token: string) => {
      try {
        setLoading(true);
        const user = await RealAuthService.getUserInfo(token);
        login(token, user);
        navigate('/overview');
      } catch (error) {
        logger.error('Failed to get user info after 2FA:', error);
        setError('Authentication succeeded but failed to load user profile');
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading]
  );

  // Validate OTP code
  const validateOTP = useCallback(
    async (code: string) => {
      if (code.length !== 6 || isSubmitting) return;

      try {
        setIsSubmitting(true);
        setError(null);

        const mutation = `
          mutation validateOTP($input: validateOTPInput!) {
            validateOTP(input: $input) {
              status
              reason
              data {
                token
                isOTP
              }
            }
          }
        `;

        const response =
          await graphQLClient.current.request<ValidateOTPResponse>(mutation, {
            input: { otpToken: code },
          });

        if (
          response.validateOTP.status !== 'OK' ||
          !response.validateOTP.data?.token
        ) {
          throw new Error(response.validateOTP.reason || 'Invalid 2FA code');
        }

        await handleAuthSuccess(response.validateOTP.data.token);
      } catch (error) {
        logger.error('2FA validation failed:', error);
        setError(error instanceof Error ? error.message : 'Invalid 2FA code');
        setOtpCode(''); // Clear the invalid code
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleAuthSuccess, isSubmitting]
  );

  // Validate recovery code
  const validateRecoveryCode = useCallback(async () => {
    if (!recoveryCode.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const mutation = `
        mutation validateRecoveryCode($input: validateRecoveryCodeInput!) {
          validateRecoveryCode(input: $input) {
            status
            reason
            data {
              token
            }
          }
        }
      `;

      const response =
        await graphQLClient.current.request<ValidateRecoveryCodeResponse>(
          mutation,
          { input: { recoveryCode: recoveryCode.trim() } }
        );

      if (
        response.validateRecoveryCode.status !== 'OK' ||
        !response.validateRecoveryCode.data?.token
      ) {
        throw new Error(
          response.validateRecoveryCode.reason || 'Invalid recovery code'
        );
      }

      await handleAuthSuccess(response.validateRecoveryCode.data.token);
    } catch (error) {
      logger.error('Recovery code validation failed:', error);
      setError(
        error instanceof Error ? error.message : 'Invalid recovery code'
      );
      setRecoveryCode(''); // Clear the invalid code
    } finally {
      setIsSubmitting(false);
    }
  }, [recoveryCode, handleAuthSuccess, isSubmitting]);

  // Handle OTP input change with auto-submit
  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(numericValue);
    setError(null);

    // Auto-submit when 6 digits are entered
    if (numericValue.length === 6) {
      validateOTP(numericValue);
    }
  };

  // Handle recovery code input change
  const handleRecoveryCodeChange = (value: string) => {
    setRecoveryCode(value);
    setError(null);
  };

  // Handle paste functionality
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const numericText = text.replace(/\D/g, '').slice(0, 6);

      if (numericText.length === 6) {
        setOtpCode(numericText);
        setError(null);
        // Auto-submit after paste
        validateOTP(numericText);
      } else {
        setError('Pasted text must contain exactly 6 digits');
      }
    } catch (_error) {
      setError('Failed to read from clipboard');
    }
  };

  // Switch between OTP and recovery code modes
  const switchToRecoveryCode = () => {
    setShowRecoveryCode(true);
    setOtpCode('');
    setError(null);
  };

  const switchToOtp = () => {
    setShowRecoveryCode(false);
    setRecoveryCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <div className="p-xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {showRecoveryCode
                  ? 'Recovery Code'
                  : 'Two-Factor Authentication'}
              </h1>
              <p className="text-muted-foreground">
                {showRecoveryCode
                  ? 'Enter one of your recovery codes to sign in'
                  : 'Enter the 6-digit code from your authenticator app'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-md bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-xs">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01"
                  />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {showRecoveryCode ? (
              /* Recovery Code Form */
              <div className="space-y-md">
                <div className="space-y-xs">
                  <Label htmlFor="recoveryCode" className="sr-only">
                    Recovery Code
                  </Label>
                  <Input
                    ref={recoveryInputRef}
                    id="recoveryCode"
                    type="text"
                    placeholder="Enter recovery code"
                    value={recoveryCode}
                    onChange={(e) => handleRecoveryCodeChange(e.target.value)}
                    className="h-12 text-center font-mono"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recoveryCode.trim()) {
                        validateRecoveryCode();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={validateRecoveryCode}
                  disabled={!recoveryCode.trim() || isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-gradient-start to-gradient-end hover:from-primary/90 hover:to-gradient-end/90 text-primary-foreground font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'VERIFYING...' : 'VERIFY RECOVERY CODE'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToOtp}
                    className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                    disabled={isSubmitting}
                  >
                    Back to authenticator code
                  </button>
                </div>
              </div>
            ) : (
              /* OTP Form */
              <div className="space-y-md">
                <div className="space-y-xs">
                  <Label htmlFor="otpCode" className="sr-only">
                    Authentication Code
                  </Label>
                  <div className="relative">
                    <Input
                      ref={otpInputRef}
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      className="h-12 text-center text-2xl font-mono tracking-widest pr-12"
                      maxLength={6}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handlePaste}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      disabled={isSubmitting}
                    >
                      <Clipboard className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Code will be verified automatically when complete
                  </p>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToRecoveryCode}
                    className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                    disabled={isSubmitting}
                  >
                    Lost your device? Use recovery code
                  </button>
                </div>
              </div>
            )}

            {/* Back Button */}
            {onBack && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
