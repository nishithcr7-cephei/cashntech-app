import type {AppRole} from '@constants/roles';

/**
 * Role Normalization Layer (PR3)
 *
 * Converts free-text backend roles (permission_group / catalog strings /
 * optional CWF product_roles) into a stable mobile capability model.
 *
 * Golden rules:
 * - DF Anchor / Dealer / internal behavior stays identical via toLegacyAppRole
 * - Vendor maps to the same counterparty capability categories as Dealer
 * - CWF product_roles consumption is additive / fallback only
 */

export type PartySide = 'anchor' | 'counterparty' | 'internal';

export type FunctionalCapability = 'maker' | 'checker' | 'all_access' | 'admin';

/** Raw party business token when known (Dealer vs Vendor for labels later). */
export type BusinessRoleToken = 'anchor' | 'dealer' | 'vendor';

export type RoleNormalizationSource =
  | 'user_type'
  | 'permission_group'
  | 'product_roles'
  | 'role_string'
  | 'first_name'
  | 'default';

export type NormalizedCapability = {
  party: PartySide;
  functional: FunctionalCapability;
  /** Preserves Dealer vs Vendor distinction for labels; null for internal. */
  businessRole: BusinessRoleToken | null;
  /** CWF catalog level when present (e.g. Checker L2). */
  level: number | null;
  source: RoleNormalizationSource;
};

export type PermissionGroupLike = {
  department?: string | null;
  business_role?: string | null;
  functional_role?: string | null;
  /** Some backends expose level on the permission group. */
  level?: number | null;
  approval_level?: number | null;
};

export type ProductRoleLike = {
  product_id?: string | null;
  role?: string | null;
  level?: number | null;
};

export type RoleNormalizeInput = {
  first_name?: string | null;
  user_type?: string | null;
  email?: string | null;
  /** Combined free-text role e.g. "Vendor Maker" / "Dealer All Access". */
  role?: string | null;
  permission_group?:
    | PermissionGroupLike[]
    | {getItems?: () => PermissionGroupLike[]}
    | null;
  /**
   * CWF additive JWT claim. Used only when permission_group does not resolve
   * a party role — never required for VF launch on cashntech-backend-vf.
   */
  product_roles?: ProductRoleLike[] | null;
  /** Optional product_id to prefer a matching CWF product_roles entry. */
  preferredProductId?: string | null;
};

const INTERNAL_CAPABILITY: NormalizedCapability = {
  party: 'internal',
  functional: 'admin',
  businessRole: null,
  level: null,
  source: 'default',
};

function normalizeToken(value: string | null | undefined): string {
  return (value || '').toLowerCase().trim();
}

function parseLevel(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

function extractPermissionGroups(
  permissionGroup: RoleNormalizeInput['permission_group'],
): PermissionGroupLike[] {
  if (!permissionGroup) {
    return [];
  }
  if (Array.isArray(permissionGroup)) {
    return permissionGroup;
  }
  return permissionGroup.getItems?.() ?? [];
}

/**
 * Detect party business side from free text (department / business_role / role string).
 * Vendor is treated as counterparty (same capability category as Dealer).
 */
export function detectBusinessRole(
  ...parts: Array<string | null | undefined>
): BusinessRoleToken | null {
  const text = parts.map(normalizeToken).filter(Boolean).join(' ');
  if (!text) {
    return null;
  }
  if (text.includes('anchor')) {
    return 'anchor';
  }
  if (text.includes('vendor')) {
    return 'vendor';
  }
  if (text.includes('dealer')) {
    return 'dealer';
  }
  // Generic counterparty wording (CWF / future products) → treat like dealer side
  if (text.includes('counterparty') || text.includes('participant')) {
    return 'dealer';
  }
  return null;
}

export function detectFunctionalCapability(
  ...parts: Array<string | null | undefined>
): FunctionalCapability | null {
  const text = parts.map(normalizeToken).filter(Boolean).join(' ');
  if (!text) {
    return null;
  }
  if (text.includes('all access') || text.includes('all_access')) {
    return 'all_access';
  }
  if (text.includes('checker')) {
    return 'checker';
  }
  if (text.includes('maker')) {
    return 'maker';
  }
  return null;
}

function partyFromBusiness(
  businessRole: BusinessRoleToken | null,
): PartySide | null {
  if (!businessRole) {
    return null;
  }
  if (businessRole === 'anchor') {
    return 'anchor';
  }
  // dealer + vendor → same counterparty capability category
  return 'counterparty';
}

function buildCapability(
  businessRole: BusinessRoleToken | null,
  functional: FunctionalCapability,
  source: RoleNormalizationSource,
  level: number | null = null,
): NormalizedCapability | null {
  const party = partyFromBusiness(businessRole);
  if (!party) {
    return null;
  }
  return {
    party,
    functional,
    businessRole,
    level,
    source,
  };
}

/**
 * Normalize a single free-text role label such as "Vendor Maker",
 * "Anchor Checker L2", "Dealer All Access".
 */
export function normalizeRoleString(
  rawRole: string | null | undefined,
  source: RoleNormalizationSource = 'role_string',
  levelHint?: number | null,
): NormalizedCapability | null {
  const text = normalizeToken(rawRole);
  if (!text) {
    return null;
  }

  // Strip trailing " L2" / " l1" style level suffixes for detection
  const levelFromLabel = text.match(/\bl\s*(\d+)\b/i);
  const level =
    levelHint != null
      ? parseLevel(levelHint)
      : levelFromLabel
        ? parseLevel(levelFromLabel[1])
        : null;

  const businessRole = detectBusinessRole(text);
  const functional = detectFunctionalCapability(text);
  if (!businessRole || !functional) {
    return null;
  }

  return buildCapability(businessRole, functional, source, level);
}

function normalizeFromPermissionGroups(
  groups: PermissionGroupLike[],
): NormalizedCapability | null {
  for (const p of groups) {
    const dept = p?.department || '';
    const bizRole = p?.business_role || '';
    const funcRole = p?.functional_role || '';
    // Party from department / business_role (Vendor ≡ Dealer capability category)
    const businessRole = detectBusinessRole(dept, bizRole);
    // Functional from functional_role only — matches legacy deriveAppRole DF path
    const functional = detectFunctionalCapability(funcRole);
    if (!businessRole || !functional) {
      continue;
    }

    const level =
      parseLevel(p?.level) ?? parseLevel(p?.approval_level) ?? null;

    const capability = buildCapability(
      businessRole,
      functional,
      'permission_group',
      level,
    );
    if (capability) {
      return capability;
    }
  }
  return null;
}

/**
 * Additive CWF fallback: catalog roles on product_roles
 * (e.g. "Vendor Maker", "Anchor Checker" + level).
 */
function normalizeFromProductRoles(
  productRoles: ProductRoleLike[] | null | undefined,
  preferredProductId?: string | null,
): NormalizedCapability | null {
  if (!Array.isArray(productRoles) || productRoles.length === 0) {
    return null;
  }

  const preferred = preferredProductId
    ? productRoles.find(
        pr =>
          pr?.product_id &&
          pr.product_id === preferredProductId &&
          pr.role,
      )
    : undefined;

  const ordered = preferred
    ? [preferred, ...productRoles.filter(pr => pr !== preferred)]
    : productRoles;

  for (const pr of ordered) {
    const capability = normalizeRoleString(
      pr?.role,
      'product_roles',
      pr?.level,
    );
    if (capability) {
      return capability;
    }
  }
  return null;
}

function isInternalUser(user: RoleNormalizeInput): boolean {
  const userType = normalizeToken(user.user_type);
  const email = normalizeToken(user.email);
  return userType === 'cashntech' || email.includes('cashntech.com');
}

/**
 * Primary entry: normalize user payload → stable capability.
 * Priority mirrors legacy deriveAppRole, with Vendor + optional product_roles.
 */
export function deriveCapabilityFromUser(
  user: RoleNormalizeInput,
): NormalizedCapability {
  if (isInternalUser(user)) {
    return {
      ...INTERNAL_CAPABILITY,
      source: 'user_type',
    };
  }

  const fromPg = normalizeFromPermissionGroups(
    extractPermissionGroups(user.permission_group),
  );
  if (fromPg) {
    return fromPg;
  }

  // Additive CWF-only path — not required for VF launch
  const fromProductRoles = normalizeFromProductRoles(
    user.product_roles,
    user.preferredProductId,
  );
  if (fromProductRoles) {
    return fromProductRoles;
  }

  const fromRole = normalizeRoleString(user.role, 'role_string');
  if (fromRole) {
    return fromRole;
  }

  const fn = normalizeToken(user.first_name);
  if (fn) {
    const fromName = normalizeRoleString(fn, 'first_name');
    if (fromName) {
      return fromName;
    }
  }

  return {
    ...INTERNAL_CAPABILITY,
    source: 'default',
  };
}

/**
 * Maps normalized capability → existing AppRole used by screens today.
 * Counterparty (Dealer OR Vendor) → dealer_* so DF UI checks keep working.
 */
export function toLegacyAppRole(capability: NormalizedCapability): AppRole {
  if (capability.party === 'internal') {
    return 'cashntech_user';
  }

  if (capability.party === 'anchor') {
    if (capability.functional === 'all_access') {
      return 'anchor_all_access';
    }
    if (capability.functional === 'checker') {
      return 'anchor_checker';
    }
    return 'anchor_maker';
  }

  // counterparty (dealer + vendor)
  if (capability.functional === 'all_access') {
    return 'dealer_all_access';
  }
  if (capability.functional === 'checker') {
    return 'dealer_checker';
  }
  return 'dealer_maker';
}

/** Display label that preserves Vendor vs Dealer wording. */
export function getCapabilityLabel(capability: NormalizedCapability): string {
  if (capability.party === 'internal') {
    return 'CashnTech User';
  }

  const partyLabel =
    capability.businessRole === 'vendor'
      ? 'Vendor'
      : capability.businessRole === 'anchor'
        ? 'Anchor'
        : 'Dealer';

  const functionalLabel =
    capability.functional === 'all_access'
      ? 'All Access'
      : capability.functional === 'checker'
        ? 'Checker'
        : 'Maker';

  const base = `${partyLabel} ${functionalLabel}`;
  if (capability.level != null && capability.functional === 'checker') {
    return `${base} L${capability.level}`;
  }
  return base;
}

export function isMakerCapability(capability: NormalizedCapability): boolean {
  return (
    capability.functional === 'maker' || capability.functional === 'all_access'
  );
}

export function isCheckerCapability(capability: NormalizedCapability): boolean {
  return (
    capability.functional === 'checker' ||
    capability.functional === 'all_access'
  );
}

export function isAnchorCapability(capability: NormalizedCapability): boolean {
  return capability.party === 'anchor';
}

export function isCounterpartyCapability(
  capability: NormalizedCapability,
): boolean {
  return capability.party === 'counterparty';
}

export function isInternalCapability(
  capability: NormalizedCapability,
): boolean {
  return capability.party === 'internal';
}
