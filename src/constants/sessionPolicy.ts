/**
 * Client-side session limits layered on top of backend token expiry.
 * Backend (access 15m / refresh 14d sliding) stays authoritative; these add
 * inactivity protection the backend cannot see.
 */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/** App left in background longer than this → logout on return. */
export const BACKGROUND_TIMEOUT_MS = 5 * 60 * 1000;

/** Hard cap from login, regardless of activity. */
export const MAX_SESSION_MS = 12 * 60 * 60 * 1000;

/** "Continue session?" warning shown this long before idle logout. */
export const IDLE_WARNING_MS = 60 * 1000;

/** Minimum gap between persisted activity writes (touch events are frequent). */
export const ACTIVITY_PERSIST_THROTTLE_MS = 5 * 1000;
