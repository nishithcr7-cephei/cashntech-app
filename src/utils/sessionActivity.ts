import StorageKeys from '@constants/StorageKeys';
import {
  ACTIVITY_PERSIST_THROTTLE_MS,
  BACKGROUND_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  MAX_SESSION_MS,
} from '@constants/sessionPolicy';
import {storage} from '@services/localStorage';

export type SessionExpiryReason = 'idle' | 'background' | 'max' | 'expired';

let lastActiveInMemory = 0;
let lastPersistedAt = 0;

const readMs = (key: string): number | null => {
  const raw = storage.getString(key);
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const writeMs = (key: string, value: number) => {
  storage.set(key, String(value));
};

export const markSessionStarted = (now: number = Date.now()) => {
  writeMs(StorageKeys.SESSION_STARTED_AT, now);
  writeMs(StorageKeys.LAST_ACTIVE_AT, now);
  storage.delete(StorageKeys.BACKGROUND_AT);
  lastActiveInMemory = now;
  lastPersistedAt = now;
};

/** Sessions restored from before this feature have no timestamps yet. */
export const ensureSessionStarted = () => {
  if (readMs(StorageKeys.SESSION_STARTED_AT) === null) {
    markSessionStarted();
  }
};

export const markActivity = (now: number = Date.now()) => {
  lastActiveInMemory = now;
  if (now - lastPersistedAt >= ACTIVITY_PERSIST_THROTTLE_MS) {
    writeMs(StorageKeys.LAST_ACTIVE_AT, now);
    lastPersistedAt = now;
  }
};

export const markBackground = (now: number = Date.now()) => {
  if (lastActiveInMemory > 0) {
    writeMs(StorageKeys.LAST_ACTIVE_AT, lastActiveInMemory);
    lastPersistedAt = now;
  }
  writeMs(StorageKeys.BACKGROUND_AT, now);
};

export const clearBackground = () => {
  storage.delete(StorageKeys.BACKGROUND_AT);
};

const getLastActiveAt = (): number | null => {
  const persisted = readMs(StorageKeys.LAST_ACTIVE_AT);
  if (persisted === null) {
    return lastActiveInMemory > 0 ? lastActiveInMemory : null;
  }
  return Math.max(persisted, lastActiveInMemory);
};

export const getIdleRemainingMs = (now: number = Date.now()): number => {
  const lastActive = getLastActiveAt();
  if (lastActive === null) {
    return IDLE_TIMEOUT_MS;
  }
  return IDLE_TIMEOUT_MS - (now - lastActive);
};

/** Returns why the session must end, or null while it is still allowed. */
export const getSessionExpiryReason = (
  now: number = Date.now(),
): SessionExpiryReason | null => {
  const startedAt = readMs(StorageKeys.SESSION_STARTED_AT);
  if (startedAt === null) {
    return null;
  }
  if (now - startedAt >= MAX_SESSION_MS) {
    return 'max';
  }
  const backgroundAt = readMs(StorageKeys.BACKGROUND_AT);
  if (backgroundAt !== null && now - backgroundAt >= BACKGROUND_TIMEOUT_MS) {
    return 'background';
  }
  if (getIdleRemainingMs(now) <= 0) {
    return 'idle';
  }
  return null;
};

export const SESSION_EXPIRY_MESSAGES: Record<SessionExpiryReason, string> = {
  idle: 'Session expired due to inactivity. Please log in again.',
  background:
    'Session expired while the app was in background. Please log in again.',
  max: 'Maximum session time reached. Please log in again.',
  expired: 'Your session has expired. Please log in again.',
};
