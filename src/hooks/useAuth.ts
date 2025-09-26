import StorageKeys from '@constants/StorageKeys';
import {getStorage, setStorage} from '@services/localStorage';
import {authActions, authSelector} from '@store/auth';
import {userActions} from '@store/user';
import {decodeJWT, isTokenExpired} from '@utils/Utils';
import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';


export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoggedInState = useSelector(authSelector.getLoggedInState);
  const dispatch = useDispatch();

  useEffect(() => {
    const storedLoginStatus = getStorage(StorageKeys.IS_LOGGED_IN, true);
    const storedToken = getStorage(StorageKeys.TOKEN);
    const rememberMe = getStorage(StorageKeys.REMEMBER_ME, true);
    
    if(!rememberMe){
      setStorage(StorageKeys.TOKEN, null);
      setStorage(StorageKeys.IS_LOGGED_IN, false);
      return;
    }
    
    // Check if token exists and is not expired
    if (storedToken && !isTokenExpired(storedToken)) {
      dispatch(userActions.loadInfoFromToken(storedToken));
      dispatch(authActions.setIsLoggedIn(true));
    } else if (storedToken && isTokenExpired(storedToken)) {
      // Token is expired, clear it and log out
      console.log('Token expired, logging out user');
      setStorage(StorageKeys.TOKEN, null);
      setStorage(StorageKeys.IS_LOGGED_IN, false);
      dispatch(authActions.setIsLoggedIn(false));
    } else {
      dispatch(authActions.setIsLoggedIn(false));
    }
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
