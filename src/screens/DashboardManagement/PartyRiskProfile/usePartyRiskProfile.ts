import {useCallback, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {HomeNavigatorType} from '@type/NavigatorTypes';
import {fetchPartyRiskProfileRequest} from '@store/riskDashboard/riskDashboard.slice';
import {selectPartyRiskProfile} from '@store/riskDashboard/riskDashboard.selector';
import type {FetchMode} from '@store/riskDashboard/riskDashboard.types';
import {useRefetchOnFocus} from '../useRefetchOnFocus';
import {buildPartyKpis, buildPartySubtitle} from './partyProfileKpis';

export const usePartyRiskProfile = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HomeNavigatorType, 'PartyRiskProfile'>>();
  const partyId = route.params?.partyId ?? '';
  const partyNameParam = route.params?.partyName ?? '';
  const fromBankId = route.params?.bankId;
  const fromBankName = route.params?.bankName;
  const slot = useSelector(selectPartyRiskProfile);

  useEffect(() => {
    if (partyId) {
      dispatch(fetchPartyRiskProfileRequest({partyId}));
    }
  }, [dispatch, partyId]);

  const isCurrentParty = slot.partyId === partyId;

  const fetchData = useCallback(
    (mode?: FetchMode) => dispatch(fetchPartyRiskProfileRequest({partyId, ...mode})),
    [dispatch, partyId],
  );
  useRefetchOnFocus(slot, fetchData, !!partyId && isCurrentParty);

  const onRefresh = useCallback(() => {
    if (partyId) {
      dispatch(fetchPartyRiskProfileRequest({partyId, refresh: true}));
    }
  }, [dispatch, partyId]);

  const onRetry = useCallback(() => {
    if (partyId) {
      dispatch(fetchPartyRiskProfileRequest({partyId}));
    }
  }, [dispatch, partyId]);

  const onBack = useCallback(() => {
    if (fromBankId) {
      navigation.navigate('BankRiskDetail', {
        bankId: fromBankId,
        bankName: fromBankName,
      });
      return;
    }
    navigation.navigate('EcosystemRiskProfile');
  }, [navigation, fromBankId, fromBankName]);

  const data = isCurrentParty ? slot.data : null;

  const kpis = useMemo(() => (data ? buildPartyKpis(data) : []), [data]);
  const subtitle = useMemo(() => (data ? buildPartySubtitle(data) : ''), [data]);

  return {
    navigation,
    partyName: data?.partyName || partyNameParam,
    data,
    kpis,
    subtitle,
    loading: !isCurrentParty || slot.loading,
    refreshing: slot.refreshing,
    updating: isCurrentParty && slot.updating,
    error: isCurrentParty ? slot.error : null,
    onRefresh,
    onRetry,
    onBack,
  };
};
