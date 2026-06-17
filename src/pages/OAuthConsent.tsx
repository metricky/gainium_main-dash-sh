import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

const API_ENDPOINT =
  (import.meta.env.VITE_API_ENDPOINT as string) || 'http://localhost:7503';

interface ConsentParams {
  clientId: string;
  clientName: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state?: string;
  resource?: string;
}

function readParams(): ConsentParams {
  const q = new URLSearchParams(window.location.search);
  return {
    clientId: q.get('client_id') ?? '',
    clientName: q.get('client_name') ?? 'An application',
    redirectUri: q.get('redirect_uri') ?? '',
    scope: q.get('scope') ?? 'read',
    codeChallenge: q.get('code_challenge') ?? '',
    codeChallengeMethod: q.get('code_challenge_method') ?? 'S256',
    state: q.get('state') ?? undefined,
    resource: q.get('resource') ?? undefined,
  };
}

/**
 * OAuth consent screen. The backend's GET /authorize validated the request and
 * redirected the browser here. We authenticate the user via the existing
 * session (authStore), let them choose scope + restrictions, and POST the
 * decision back to /oauth/authorize/decision with the session token. The
 * backend mints the code and returns the redirect URL back to the client.
 */
const OAuthConsent: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, tokens } = useAuthStore();
  // eslint-disable-next-line react-hooks/use-memo
  const params = useMemo(readParams, []);

  const writeRequested = params.scope.split(/\s+/).includes('write');
  const [allowWrite, setAllowWrite] = useState(false);
  const [paperOnly, setPaperOnly] = useState(false);
  const [botId, setBotId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not signed in → bounce to login, preserving this full URL so we come back.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const here = window.location.pathname + window.location.search;
      navigate(`/login?redirectTo=${encodeURIComponent(here)}`, {
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const invalid =
    !params.clientId || !params.redirectUri || !params.codeChallenge;

  async function submit(approved: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_ENDPOINT}/oauth/authorize/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: tokens?.accessToken ?? '',
        },
        body: JSON.stringify({
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          scope:
            approved && writeRequested && allowWrite ? params.scope : 'read',
          code_challenge: params.codeChallenge,
          code_challenge_method: params.codeChallengeMethod,
          state: params.state,
          resource: params.resource,
          approved,
          paper_context: approved && paperOnly ? true : undefined,
          bot_id: approved && botId.trim() ? botId.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(
          data.error_description || data.error || 'Authorization failed'
        );
        setSubmitting(false);
        return;
      }
      // Leave the SPA — hand control back to the OAuth client.
      window.location.href = data.redirect;
    } catch (e) {
      setError((e as Error)?.message ?? 'Network error');
      setSubmitting(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-md">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-xs">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Authorize access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-lg">
          {invalid ? (
            <p className="text-sm text-destructive">
              This authorization request is missing required parameters.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {params.clientName}
                </span>{' '}
                wants to access your Gainium account through the API.
              </p>

              <div className="space-y-md">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Read access</Label>
                    <p className="text-xs text-muted-foreground">
                      View bots, deals, balances and account data.
                    </p>
                  </div>
                  <Switch checked disabled />
                </div>

                {writeRequested && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Trading (write) access</Label>
                      <p className="text-xs text-muted-foreground">
                        Create, start, stop and modify bots and deals.
                      </p>
                    </div>
                    <Switch
                      checked={allowWrite}
                      onCheckedChange={setAllowWrite}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Paper trading only</Label>
                    <p className="text-xs text-muted-foreground">
                      Restrict this connection to paper trading.
                    </p>
                  </div>
                  <Switch checked={paperOnly} onCheckedChange={setPaperOnly} />
                </div>

                <div className="space-y-xs">
                  <Label>Restrict to bot ID (optional)</Label>
                  <Input
                    value={botId}
                    onChange={(e) => setBotId(e.target.value)}
                    placeholder="Leave empty for all bots"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-sm">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => submit(false)}
                >
                  Deny
                </Button>
                <Button
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => submit(true)}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Authorize'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsent;
