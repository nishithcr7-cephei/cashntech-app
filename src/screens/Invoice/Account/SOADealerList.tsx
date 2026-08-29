import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {LeftChevron} from '@assets/Icons';
import Toast from 'react-native-toast-message';
import {
  fetchDealerListRequest,
  resetDealerState,
} from '@store/soa/dealer/dealer.slice';
import {
  dealerListSelector,
  dealerLoadingSelector,
  totalDealersSelector,
  dealerErrorSelector,
} from '@store/soa/dealer/dealer.selector';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectEffectiveProductCode} from '@store/product/product.selectors';
import {PRODUCT_CODES} from '@store/product/product.types';
import {soaDetailsApi, ProgramSummaryApi} from '@services/api/soa_details.api';
import {
  SHOW_SOA_VENDOR_LIST_PROGRAM_HEADER,
  SOAVendorListProgramHeader,
} from './SOAVendorListProgramHeader';

export const SOADealerList: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const routeProgramId = (route.params as any)?.programId || '';
  const routeProgramIds = (route.params as any)?.programIds;
  const programName = (route.params as any)?.programName || 'Program name';
  const routeBankName = (route.params as any)?.bankName;
  const routePartyName = (route.params as any)?.partyName;
  const routeStatus = (route.params as any)?.status;
  const routeProgramLimit = (route.params as any)?.totalSanctionedAmount;
  const routeTotalOutstanding = (route.params as any)?.totalOutstanding;
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isDealerChecker = userRole === 'dealer_checker';
  const effectiveCode = useSelector(selectEffectiveProductCode);
  const isVendorFinance = effectiveCode === PRODUCT_CODES.VENDOR_FINANCE;
  const partyLabel = isVendorFinance ? 'Vendor' : 'Dealer';
  const partyLabelPlural = isVendorFinance ? 'Vendors' : 'Dealers';
  const partyNameLabel = isVendorFinance ? 'Vendor Name' : 'Dealer Name';

  const selectedProgramIds = useMemo(
    () =>
      Array.isArray(routeProgramIds) && routeProgramIds.length > 0
        ? routeProgramIds.filter(Boolean)
        : routeProgramId
          ? [routeProgramId]
          : [],
    [routeProgramId, routeProgramIds],
  );
  const programId = selectedProgramIds[0] || routeProgramId;

  const dealerList = useSelector(dealerListSelector);
  const loading = useSelector(dealerLoadingSelector);
  const totalDealers = useSelector(totalDealersSelector);
  const dealerError = useSelector(dealerErrorSelector);
  const [programSummary, setProgramSummary] = useState<ProgramSummaryApi | null>(
    null,
  );

  useEffect(() => {
    if (dealerError && (dealerError.toLowerCase().includes('token expired') || dealerError.toLowerCase().includes('unauthorized'))) {
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Your token has expired. Please log in again.',
        visibilityTime: 4000,
      });
    } else if (dealerError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: dealerError,
      });
    }
  }, [dealerError]);

  // Fetch dealer list when selected program changes
  useEffect(() => {
    if (selectedProgramIds.length > 0) {
      dispatch(
        fetchDealerListRequest({
          programIds: selectedProgramIds,
          isInitialLoad: true,
        }),
      );
    }
    return () => {
      dispatch(resetDealerState());
    };
  }, [dispatch, selectedProgramIds]);

  useEffect(() => {
    if (!SHOW_SOA_VENDOR_LIST_PROGRAM_HEADER || !programId) {
      return;
    }
    let cancelled = false;
    soaDetailsApi
      .getProgramSummary(programId)
      .then(summary => {
        if (!cancelled) {
          setProgramSummary(summary);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProgramSummary(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [programId]);

  const headerAvailableLimit = useMemo(() => {
    if (!programSummary) {
      return null;
    }
    const limit = Number(programSummary.total_limit || 0);
    const utilized = Number(programSummary.utilized_amount || 0);
    const pipeline = Number(programSummary.pipeline_requests || 0);
    if (!Number.isFinite(limit)) {
      return null;
    }
    return limit - utilized - pipeline;
  }, [programSummary]);

  const renderDealerItem = ({item, index}: {item: any; index: number}) => {
    const isStatusActive = item.status?.toLowerCase() === 'active';

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.listCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            {!isDealerChecker && (
              <View style={styles.cardHeaderTextContent}>
                <Text style={styles.cardTitle}>{item.counterPartyName}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>{partyNameLabel}</Text>
              <Text style={styles.infoValue}>{item.counterPartyName}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Loan/OD Account</Text>
              <TouchableOpacity
                disabled={!programId}
                onPress={() =>
                  (navigation as any).navigate('CreditAccountDetails', {
                    id: item.id,
                    programId,
                    dealerName: item.counterPartyName,
                    creditAccount: item.odAccount,
                    anchor: programName,
                  })
                }>
                <Text style={[styles.infoValue, styles.linkText]}>{item.odAccount}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>OD Expiry Date</Text>
              <Text style={styles.infoValue}>{item.odExpiryDate}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Sanction Limit</Text>
              <Text style={styles.infoValue}>{item.sanctionLimit}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Drawing Power</Text>
              <Text style={styles.infoValue}>{item.drawingPower}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Utilized Amount (₹)</Text>
              <Text style={styles.infoValue}>{item.utilizedAmount}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Pipeline Requests</Text>
              <Text style={styles.infoValue}>{item.pipelineRequests}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Excess Credit</Text>
              <Text style={styles.infoValue}>{item.excessCredit}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Available Limit</Text>
              <Text style={styles.infoValue}>{item.availableLimit}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Overdue Days</Text>
              <Text style={styles.infoValue}>{item.overdueDays}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text
                style={[
                  styles.infoValue,
                  isStatusActive ? styles.statusGreen : styles.statusRed,
                ]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={Colors.primaryColor} />
      </View>
    );
  };

  return (
    <Container>
      <AppBar 
        title="Transactions > Statement of Account (SOA)" 
        navigation={navigation as any} 
        hideHamburger={true}
        renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
        onPressLeftIcon={() => (navigation as any).navigate('StatementOfAccount')}
      />
      
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>
          {partyLabel} list of {programName}
        </Text>
      </View>

      {SHOW_SOA_VENDOR_LIST_PROGRAM_HEADER ? (
        <View style={styles.programHeaderWrap}>
          <SOAVendorListProgramHeader
            programName={programName}
            anchorName={programSummary?.entity_name || routePartyName}
            bankName={routeBankName}
            status={routeStatus}
            programLimit={programSummary?.total_limit ?? routeProgramLimit}
            availableLimit={headerAvailableLimit}
            principalDpd={programSummary?.overdue_days}
            totalDue={
              programSummary?.total_outstanding ?? routeTotalOutstanding
            }
          />
        </View>
      ) : null}

      <View style={styles.content}>
        <View style={styles.dealersHeader}>
          <Text style={styles.dealersLabel}>{partyLabelPlural}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalDealers}</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Fetching {partyLabelPlural.toLowerCase()}...</Text>
          </View>
        )}

        {!loading && dealerList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {partyLabelPlural.toLowerCase()} found for {programName}
            </Text>
          </View>
        )}

        {!loading && dealerList.length > 0 && (
          <FlatList
            data={dealerList}
            renderItem={renderDealerItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  programHeaderWrap: {
    paddingHorizontal: scaleWidth(16),
    backgroundColor: '#F8F9FA',
    paddingBottom: scaleHeight(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(16),
  },
  dealersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
    gap: scaleWidth(8),
  },
  dealersLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  badge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(16),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    backgroundColor: Colors.white,
    gap: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
    fontFamily: Fonts.GilroyMedium,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(6),
  },
  filterText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  listContent: {
    paddingBottom: scaleHeight(20),
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: scaleHeight(16),
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  indexBadge: {
    backgroundColor: '#F7F8FB',
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    marginRight: scaleWidth(12),
  },
  indexText: {
    color: Colors.graybase,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardHeaderTextContent: {
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  infoColumn: {
    width: '47%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(12),
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  statusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  statusRed: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  loaderFooter: {
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scaleFont(16),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  linkText: {
    color: Colors.tertiaryColor,
    textDecorationLine: 'underline',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleHeight(40),
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
});
