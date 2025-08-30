declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL: string;
    RK_ENCRYPTION_KEY: string;
    RK_ENCRYPTION_IV: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
