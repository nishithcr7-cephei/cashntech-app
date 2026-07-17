export default {
  TOKEN: 'AUTH_TOKEN',
  IS_LOGGED_IN: 'IS_LOGGED_IN',
  REMEMBER_ME: 'REMEMBER_ME',
  USER_INFO: 'USER_INFO', // full user object JSON (OTP verify response)
  /** Active product context JSON (ResolvedProduct) — restored in PR2 bootstrap */
  ACTIVE_PRODUCT: 'ACTIVE_PRODUCT',
  /** Available products JSON (ResolvedProduct[]) — restored in PR2 bootstrap */
  AVAILABLE_PRODUCTS: 'AVAILABLE_PRODUCTS',
} as const;
