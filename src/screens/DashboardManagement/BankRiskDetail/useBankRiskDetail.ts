import {useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {HomeNavigatorType} from '@type/NavigatorTypes';
import {fetchBankRiskDetailRequest} from '@store/riskDashboard/riskDashboard.slice';
import {selectBankRiskDetail} from '@store/riskDashboard/riskDashboard.selector';
import type {
  BankRiskParty,
  FetchMode,
} from '@store/riskDashboard/riskDashboard.types';
import {useRefetchOnFocus} from '../useRefetchOnFocus';
import {
  buildBankDetailKpis,
  filterParties,
  PartyFilterChip,
} from './bankDetailKpis';

export const useBankRiskDetail = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HomeNavigatorType, 'BankRiskDetail'>>();
  const bankId = route.params?.bankId ?? '';
  const bankNameParam = route.params?.bankName ?? '';
  const slot = useSelector(selectBankRiskDetail);
  const [chip, setChip] = useState<PartyFilterChip>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (bankId) {
      setChip('all');
      setSearchText('');
      dispatch(fetchBankRiskDetailRequest({bankId}));
    }
  }, [dispatch, bankId]);

  const isCurrentBank = slot.bankId === bankId;

  const fetchData = useCallback(
    (mode?: FetchMode) => dispatch(fetchBankRiskDetailRequest({bankId, ...mode})),
    [dispatch, bankId],
  );
  useRefetchOnFocus(slot, fetchData, !!bankId && isCurrentBank);

  const onRefresh = useCallback(() => {
    if (bankId) {
      dispatch(fetchBankRiskDetailRequest({bankId, refresh: true}));
    }
  }, [dispatch, bankId]);

  const onRetry = useCallback(() => {
    if (bankId) {
      dispatch(fetchBankRiskDetailRequest({bankId}));
    }
  }, [dispatch, bankId]);

  const onBack = useCallback(() => {
    navigation.navigate('EcosystemRiskProfile');
  }, [navigation]);

  const data = isCurrentBank ? slot.data : null;
  const bankName = data?.bankName || bankNameParam;

  const openParty = useCallback(
    (party: BankRiskParty) => {
      navigation.navigate('PartyRiskProfile', {
        partyId: party.partyId,
        partyName: party.partyName,
        bankId,
        bankName,
      });
    },
    [navigation, bankId, bankName],
  );

  const kpis = useMemo(() => (data ? buildBankDetailKpis(data) : []), [data]);

  const parties = useMemo(
    () => filterParties(data?.parties ?? [], chip, searchText),
    [data, chip, searchText],
  );

  const loading = !isCurrentBank || slot.loading;

  return {
    navigation,
    bankName,
    data,
    kpis,
    parties,
    chip,
    setChip,
    searchText,
    setSearchText,
    loading,
    /** Detail resolved with no exposure (backend `data: null`). */
    noExposure: !loading && !slot.error && isCurrentBank && !data,
    refreshing: slot.refreshing,
    updating: isCurrentBank && slot.updating,
    error: isCurrentBank ? slot.error : null,
    onRefresh,
    onRetry,
    onBack,
    openParty,
  };
};
