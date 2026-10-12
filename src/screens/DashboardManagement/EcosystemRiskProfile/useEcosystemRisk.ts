import {useCallback, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {fetchEcosystemRiskRequest} from '@store/riskDashboard/riskDashboard.slice';
import {selectEcosystemRisk} from '@store/riskDashboard/riskDashboard.selector';
import type {
  EcosystemBankRow,
  FetchMode,
} from '@store/riskDashboard/riskDashboard.types';
import {useRefetchOnFocus} from '../useRefetchOnFocus';
import {buildEcosystemKpis, filterBanksByName} from './ecosystemKpis';

export const useEcosystemRisk = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const slot = useSelector(selectEcosystemRisk);
  const [searchText, setSearchText] = useState('');

  const fetchData = useCallback(
    (mode?: FetchMode) => dispatch(fetchEcosystemRiskRequest(mode)),
    [dispatch],
  );
  useRefetchOnFocus(slot, fetchData);

  const onRefresh = useCallback(() => {
    dispatch(fetchEcosystemRiskRequest({refresh: true}));
  }, [dispatch]);

  const onRetry = useCallback(() => {
    dispatch(fetchEcosystemRiskRequest());
  }, [dispatch]);

  const openBank = useCallback(
    (row: EcosystemBankRow) => {
      navigation.navigate('BankRiskDetail', {
        bankId: row.bankId,
        bankName: row.bankName,
      });
    },
    [navigation],
  );

  const kpis = useMemo(
    () => (slot.data ? buildEcosystemKpis(slot.data.overview) : []),
    [slot.data],
  );

  const rows = useMemo(
    () => filterBanksByName(slot.data?.rows ?? [], searchText),
    [slot.data, searchText],
  );

  return {
    navigation,
    data: slot.data,
    kpis,
    dpdBuckets: slot.data?.overview.dpdBuckets ?? [],
    rows,
    totalBanks: slot.data?.rows.length ?? 0,
    searchText,
    setSearchText,
    loading: slot.loading || (!slot.data && !slot.error),
    refreshing: slot.refreshing,
    updating: slot.updating,
    error: slot.error,
    onRefresh,
    onRetry,
    openBank,
  };
};
