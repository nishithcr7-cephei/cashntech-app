import StorageKeys from '@constants/StorageKeys';
import {getStorage, setStorage} from '@services/localStorage';
import {authActions, authSelector} from '@store/auth';
import {userActions} from '@store/user';
import {hydrateProductRequest} from '@store/product/product.slice';
import {isTokenExpired} from '@utils/Utils';
import {clearBackground, getSessionExpiryReason} from '@utils/sessionActivity';
import {expireSession} from '@services/api/api';
import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';


export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoggedInState = useSelector(authSelector.getLoggedInState);
  const dispatch = useDispatch();

  useEffect(() => {
    const storedToken = getStorage(StorageKeys.TOKEN);
    const rememberMe = getStorage(StorageKeys.REMEMBER_ME, true);

    if (!rememberMe) {
      setStorage(StorageKeys.TOKEN, null);
      setStorage(StorageKeys.IS_LOGGED_IN, false);
      return;
    }

    if (!storedToken) {
      dispatch(authActions.setIsLoggedIn(false));
      return;
    }

    // Idle / background / max-session limit passed while the app was closed.
    const sessionReason = getSessionExpiryReason();
    if (sessionReason) {
      expireSession(sessionReason);
      return;
    }

    // An expired access token is fine while a refresh token exists — the API
    // layer refreshes it on the first call.
    const refreshToken = getStorage(StorageKeys.REFRESH_TOKEN);
    if (isTokenExpired(storedToken) && !refreshToken) {
      expireSession('expired');
      return;
    }

    clearBackground();
    dispatch(hydrateProductRequest());
    dispatch(userActions.loadInfoFromToken(storedToken));
    dispatch(authActions.setIsLoggedIn(true));
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      clearTimeout(timer);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return {
    isInitialized,
    isLoggedIn: isLoggedInState,
  };
}
