/**
 * Get relative time string from timestamp
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Human-readable relative time string
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ago`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Alternative implementation that matches the original getLastTime function behavior
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Human-readable relative time string
 */
export function getLastTime(timestamp: number): string {
  return getRelativeTime(timestamp);
}

/**
 * Compact relative time, e.g. "12m", "2h", "1d", "3w".
 * Designed for tight UI captions like "Generated 12m ago" on preset
 * cards where the longer "12 minutes" form would wrap.
 *
 * @param timestamp Unix timestamp in milliseconds
 */
export function getCompactRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

/** Threshold (ms) above which a generatedAt timestamp is considered stale. */
export const STALE_GENERATED_AT_MS = 24 * 60 * 60 * 1000;

/**
 * True when the timestamp is older than 24h. Used by curated-preset
 * surfaces to color the "Generated X ago" caption with `text-warning`.
 */
export function isGeneratedAtStale(timestamp: number): boolean {
  return Date.now() - timestamp > STALE_GENERATED_AT_MS;
}
