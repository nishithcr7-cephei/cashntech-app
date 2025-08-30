import Config from 'react-native-config';
import {getEnvironmentVariable} from '@utils/Utils';

export const API_URL = getEnvironmentVariable(Config.API_URL);
export const RK_ENCRYPTION_KEY = getEnvironmentVariable(
  Config.RK_ENCRYPTION_KEY,
);
export const RK_ENCRYPTION_IV = getEnvironmentVariable(Config.RK_ENCRYPTION_IV);
