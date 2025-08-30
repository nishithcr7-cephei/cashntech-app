import StorageKeys from '@constants/StorageKeys';
import {getStorage} from '@services/localStorage';
import {authActions, authSelector} from '@store/auth';
import {userActions} from '@store/user';
import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoggedInState = useSelector(authSelector.getLoggedInState);
  const dispatch = useDispatch();

  useEffect(() => {
    const storedLoginStatus = getStorage(StorageKeys.IS_LOGGED_IN, true);
    const storedToken = getStorage(StorageKeys.TOKEN);
    if (storedToken) {
      dispatch(userActions.loadInfoFromToken(storedToken));
    }
    dispatch(authActions.setIsLoggedIn(storedLoginStatus && storedToken));
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
