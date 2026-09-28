export default {
  TOKEN: 'AUTH_TOKEN',
  REFRESH_TOKEN: 'AUTH_REFRESH_TOKEN',
  IS_LOGGED_IN: 'IS_LOGGED_IN',
  REMEMBER_ME: 'REMEMBER_ME',
  USER_INFO: 'USER_INFO', // full user object JSON (OTP verify response)
  /** Active product context JSON (ResolvedProduct) — restored in PR2 bootstrap */
  ACTIVE_PRODUCT: 'ACTIVE_PRODUCT',
  /** Available products JSON (ResolvedProduct[]) — restored in PR2 bootstrap */
  AVAILABLE_PRODUCTS: 'AVAILABLE_PRODUCTS',
  /** Epoch ms of login — enforces MAX_SESSION_MS */
  SESSION_STARTED_AT: 'SESSION_STARTED_AT',
  /** Epoch ms of last user touch — enforces IDLE_TIMEOUT_MS */
  LAST_ACTIVE_AT: 'LAST_ACTIVE_AT',
  /** Epoch ms when app went to background — enforces BACKGROUND_TIMEOUT_MS */
  BACKGROUND_AT: 'BACKGROUND_AT',
} as const;
