import {useCallback, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  AsyncSlot,
  FetchMode,
  RISK_DASHBOARD_STALE_MS,
} from '@store/riskDashboard/riskDashboard.types';

/**
 * Drawer screens stay mounted, so a mount effect only fires once per session.
 * On every focus: (re)load if never fetched successfully, otherwise a silent background
 * refetch when the data is older than RISK_DASHBOARD_STALE_MS.
 * `enabled` = false when the slot belongs to another bank/party.
 */
export const useRefetchOnFocus = (
  slot: AsyncSlot<unknown>,
  fetch: (mode?: FetchMode) => void,
  enabled = true,
) => {
  const latest = useRef({slot, fetch, enabled});
  latest.current = {slot, fetch, enabled};

  useFocusEffect(
    useCallback(() => {
      const {slot: s, fetch: run, enabled: on} = latest.current;
      if (!on || s.loading || s.refreshing || s.updating) {
        return;
      }
      if (s.fetchedAt == null) {
        run();
        return;
      }
      if (Date.now() - s.fetchedAt > RISK_DASHBOARD_STALE_MS) {
        run({background: true});
      }
    }, []),
  );
};
