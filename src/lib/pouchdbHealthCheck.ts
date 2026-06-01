// Stub for self-hosted: PouchDB is disabled, so health checks are short-circuits.

export interface HealthCheckResult {
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
}

export async function performPouchDBHealthCheck(): Promise<HealthCheckResult> {
  return { isHealthy: false, errors: ['PouchDB disabled'], warnings: [] };
}

export function shouldEnablePouchDB(): boolean {
  return false;
}
