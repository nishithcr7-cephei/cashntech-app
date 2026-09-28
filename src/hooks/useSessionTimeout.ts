import {useCallback, useEffect, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {expireSession, logoutUser} from '@services/api/api';
import {IDLE_WARNING_MS} from '@constants/sessionPolicy';
import {
  clearBackground,
  ensureSessionStarted,
  getIdleRemainingMs,
  getSessionExpiryReason,
  markActivity,
  markBackground,
} from '@utils/sessionActivity';

const CHECK_INTERVAL_MS = 1000;

/**
 * Enforces idle / background / max-session limits while logged in and drives
 * the "continue session?" warning shown shortly before idle logout.
 */
export function useSessionTimeout(isLoggedIn: boolean) {
  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const evaluate = useCallback(() => {
    const reason = getSessionExpiryReason();
    if (reason) {
      setWarningVisible(false);
      expireSession(reason);
      return;
    }
    const idleLeft = getIdleRemainingMs();
    if (idleLeft <= IDLE_WARNING_MS) {
      setSecondsLeft(Math.max(0, Math.ceil(idleLeft / 1000)));
      setWarningVisible(true);
    } else {
      setWarningVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setWarningVisible(false);
      return;
    }

    ensureSessionStarted();
    evaluate();
    // Background timestamp is only meaningful until the first foreground check.
    clearBackground();

    const interval = setInterval(evaluate, CHECK_INTERVAL_MS);

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'background') {
        markBackground();
      } else if (state === 'active') {
        evaluate();
        clearBackground();
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isLoggedIn, evaluate]);

  const continueSession = useCallback(() => {
    markActivity();
    setWarningVisible(false);
  }, []);

  const logoutNow = useCallback(() => {
    setWarningVisible(false);
    logoutUser();
  }, []);

  return {warningVisible, secondsLeft, continueSession, logoutNow};
}
