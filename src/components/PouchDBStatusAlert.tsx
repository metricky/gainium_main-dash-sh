import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface PouchDBStatusAlertProps {
  isInitializing?: boolean;
  isInitialized?: boolean;
  isDisabled?: boolean;
  error?: Error | null;
  className?: string;
}

/**
 * Component to display PouchDB sync status to users
 */
export function PouchDBStatusAlert({
  isInitializing,
  isInitialized,
  isDisabled,
  error,
  className,
}: PouchDBStatusAlertProps) {
  // If disabled due to missing config or error
  if (isDisabled) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Cloud Sync Disabled</AlertTitle>
        <AlertDescription>
          <div className="space-y-xs">
            <p>
              Cloud synchronization with CouchDB is currently disabled.
              {error && (
                <span className="block mt-1 text-sm">{error.message}</span>
              )}
            </p>
            <details className="text-xs opacity-75">
              <summary className="cursor-pointer hover:opacity-100">
                Troubleshooting steps
              </summary>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>
                  Check that <code>VITE_COUCHDB_URL</code>,{' '}
                  <code>VITE_COUCHDB_USER</code>, and{' '}
                  <code>VITE_COUCHDB_PASSWORD</code> are set in your .env file
                </li>
                <li>Verify CouchDB server is running and accessible</li>
                <li>
                  Run <code>./configure-couchdb-cors.sh</code> to configure CORS
                </li>
                <li>Check browser console for detailed error messages</li>
              </ul>
            </details>
            <p className="text-sm mt-2">
              <strong>Your data is safe:</strong> All changes are saved locally
              and the app will work normally.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If initializing
  if (isInitializing) {
    return (
      <Alert variant="default" className={className}>
        <Info className="h-4 w-4 animate-pulse" />
        <AlertTitle>Connecting to Cloud Sync</AlertTitle>
        <AlertDescription>
          Setting up synchronization with CouchDB...
        </AlertDescription>
      </Alert>
    );
  }

  // If initialized successfully
  if (isInitialized) {
    return (
      <Alert variant="default" className={className}>
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>Cloud Sync Active</AlertTitle>
        <AlertDescription>
          Your data is being synchronized with CouchDB.
        </AlertDescription>
      </Alert>
    );
  }

  // If there's an error but not disabled
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sync Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  // Default state (waiting for initialization)
  return null;
}
