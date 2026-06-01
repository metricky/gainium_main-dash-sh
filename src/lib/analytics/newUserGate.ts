/**
 * New-user gate for activation analytics.
 *
 * We only fire activation events (signup_completed, tutorial_*, exchange_*,
 * bot_created, bot_first_deal_closed) for users still inside the activation
 * window — this keeps PostHog event volume under the free-tier limit while
 * still answering "what's blocking new users".
 *
 * "New user" =
 *   user has NOT earned profit yet (onboardingSteps.earnProfit !== true)
 *   AND we first identified them less than NEW_USER_WINDOW_MS ago.
 *
 * `firstSeenAt` is anchored per-user in localStorage on the first identify
 * call and never overwritten. This survives reloads and gives a stable
 * cutoff even when the server doesn't expose a real createdAt.
 *
 * The gate is module-state, not React state, so call sites can stay
 * synchronous (no hooks required). `setGateContext()` is called from
 * `usePostHogIdentification` on every user/profile update.
 */
import type { User } from '@/types/auth';

const NEW_USER_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FIRST_SEEN_KEY_PREFIX = 'gainium:firstSeenAt:';

let cachedUser: User | null = null;
let cachedFirstSeenAt: number | null = null;

function readOrAnchorFirstSeen(userId: string): number {
  const key = `${FIRST_SEEN_KEY_PREFIX}${userId}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed = parseInt(existing, 10);
      if (Number.isFinite(parsed)) return parsed;
    }
    const now = Date.now();
    localStorage.setItem(key, String(now));
    return now;
  } catch {
    // localStorage unavailable (private mode etc.) — fall back to now,
    // which means the gate stays open for the full window each session.
    return Date.now();
  }
}

/** Returns `true` if this identify call is the first time we've seen this user. */
export function setGateContext(user: User | null): { firstSeenJustNow: boolean } {
  cachedUser = user;
  if (!user?.id) {
    cachedFirstSeenAt = null;
    return { firstSeenJustNow: false };
  }
  const key = `${FIRST_SEEN_KEY_PREFIX}${user.id}`;
  let firstSeenJustNow = false;
  try {
    if (!localStorage.getItem(key)) firstSeenJustNow = true;
  } catch {
    // ignore — treat as not-first-seen so we don't double-fire signup events
  }
  cachedFirstSeenAt = readOrAnchorFirstSeen(user.id);
  return { firstSeenJustNow };
}

export function isNewUser(): boolean {
  if (!cachedUser || cachedFirstSeenAt == null) return false;
  if (cachedUser.onboardingSteps?.earnProfit) return false; // activated
  return Date.now() - cachedFirstSeenAt < NEW_USER_WINDOW_MS;
}

export function getFirstSeenAt(): number | null {
  return cachedFirstSeenAt;
}

/** Test-only — reset the in-memory cache. Does not touch localStorage. */
export function __resetGateForTests(): void {
  cachedUser = null;
  cachedFirstSeenAt = null;
}
