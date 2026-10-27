import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import moment from 'moment';
import {userSelector} from '@store/user';
import {selectActiveProduct} from '@store/product/product.selectors';
import {PRODUCT_DISPLAY_NAMES} from '@store/product/product.types';
import {userApi, type UserProfileApi} from '@services/api/user.api';
import {decryptConditionally} from '@utils/crypto';
import {decryptValue} from '@utils/decrypt';

export type ProfileRoleRow = {
  id: string;
  roleLabel: string;
  productLabel: string;
};

export type ProfileViewModel = {
  loading: boolean;
  error: string | null;
  fullName: string;
  initials: string;
  entityName: string;
  email: string;
  mobile: string;
  designation: string;
  memberSince: string;
  userTypeChip: string | null;
  isActive: boolean;
  isVerified: boolean;
  roles: ProfileRoleRow[];
  refresh: () => void;
};

function readName(value?: string | null): string {
  if (!value) return '';
  const raw = String(value);
  return decryptConditionally(raw) || decryptValue(raw) || raw;
}

function formatMemberSince(value?: string | null): string {
  if (!value) return '-';
  const m = moment(value);
  if (!m.isValid()) return '-';
  return m.format('D MMM YYYY');
}

function mapRolesFromProfile(
  profile: UserProfileApi | null,
  fallbackRoleLabel: string,
  fallbackProductLabel: string,
): ProfileRoleRow[] {
  const assignments = profile?.role_assignments;
  if (Array.isArray(assignments) && assignments.length > 0) {
    return assignments.map((a, idx) => ({
      id: String(a.id ?? `${a.product_id ?? 'p'}-${idx}`),
      roleLabel: String(a.label || a.role || fallbackRoleLabel || '-').trim() || '-',
      productLabel:
        String(a.product_name || fallbackProductLabel || '-').trim() || '-',
    }));
  }

  const groups = profile?.permission_group;
  if (Array.isArray(groups) && groups.length > 0) {
    return groups.map((g, idx) => {
      const roleParts = [g.business_role, g.functional_role]
        .filter(Boolean)
        .join(' ')
        .trim();
      return {
        id: `pg-${idx}`,
        roleLabel: roleParts || fallbackRoleLabel || '-',
        productLabel: g.product?.name || fallbackProductLabel || '-',
      };
    });
  }

  if (fallbackRoleLabel) {
    return [
      {
        id: 'fallback-role',
        roleLabel: fallbackRoleLabel,
        productLabel: fallbackProductLabel || '-',
      },
    ];
  }
  return [];
}

export function useProfile(): ProfileViewModel {
  const userInfo = useSelector(userSelector.getUserInfo);
  const fullNameFromStore = useSelector(userSelector.getFullName);
  const roleLabel = useSelector(userSelector.getUserRoleLabel);
  const activeProduct = useSelector(selectActiveProduct);

  const [profile, setProfile] = useState<UserProfileApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackProductLabel = activeProduct?.code
    ? PRODUCT_DISPLAY_NAMES[activeProduct.code] || activeProduct.name || ''
    : activeProduct?.name || '';

  const load = useCallback(async () => {
    const userId = userInfo?.id;
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.getUserProfile(userId);
      setProfile(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Could not load profile details',
      );
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(() => {
    const first = readName(profile?.first_name || userInfo?.first_name);
    const last = readName(profile?.last_name || userInfo?.last_name);
    const composed = `${first} ${last}`.trim();
    const fullName =
      composed ||
      fullNameFromStore?.trim() ||
      'User Name';

    const initials = (() => {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return fullName.slice(0, 2).toUpperCase() || 'U';
    })();

    const entityName =
      readName(userInfo?.party_name) ||
      readName(profile?.party_name) ||
      '-';

    const userTypeRaw = String(
      profile?.user_type || userInfo?.user_type || '',
    )
      .trim()
      .toUpperCase();
    const userTypeChip =
      userTypeRaw === 'SCF' ||
      userTypeRaw === 'BANK' ||
      userTypeRaw === 'CASHNTECH' ||
      userTypeRaw === 'PARTNER'
        ? userTypeRaw === 'CASHNTECH'
          ? 'CashnTech'
          : userTypeRaw.charAt(0) + userTypeRaw.slice(1).toLowerCase()
        : userTypeRaw || null;

    // SCF chip label stays "SCF" on web
    const chipLabel =
      userTypeRaw === 'SCF'
        ? 'SCF'
        : userTypeRaw === 'BANK'
          ? 'Bank'
          : userTypeRaw === 'CASHNTECH'
            ? 'CashnTech'
            : userTypeRaw === 'PARTNER'
              ? 'Partner'
              : userTypeChip;

    return {
      loading,
      error,
      fullName,
      initials,
      entityName,
      email:
        readName(profile?.email || userInfo?.email) ||
        userInfo?.email ||
        '-',
      mobile:
        readName(profile?.mobile_number || userInfo?.mobile_number) ||
        userInfo?.mobile_number ||
        '-',
      designation: readName(profile?.designation) || '-',
      memberSince: formatMemberSince(profile?.created_at),
      userTypeChip: chipLabel,
      isActive: profile?.is_active !== false,
      isVerified: !!profile?.is_verified,
      roles: mapRolesFromProfile(profile, roleLabel || '', fallbackProductLabel),
      refresh: load,
    };
  }, [
    profile,
    userInfo,
    fullNameFromStore,
    roleLabel,
    fallbackProductLabel,
    loading,
    error,
    load,
  ]);
}
