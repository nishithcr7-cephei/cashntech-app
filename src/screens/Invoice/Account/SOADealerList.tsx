import React, {useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container, SkeletonList} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {LeftChevron} from '@assets/Icons';
import Toast from 'react-native-toast-message';
import {
  fetchDealerListRequest,
  fetchProgramSummaryRequest,
  resetDealerState,
} from '@store/soa/dealer/dealer.slice';
import {
  dealerListSelector,
  dealerLoadingSelector,
  totalDealersSelector,
  dealerErrorSelector,
  programSummarySelector,
  programSummaryLoadingSelector,
  programSummaryErrorSelector,
} from '@store/soa/dealer/dealer.selector';
import {
  SHOW_SOA_VENDOR_LIST_PROGRAM_HEADER,
  SOAVendorListProgramHeader,
} from './SOAVendorListProgramHeader';
import SOAVendorsCombinedSummary from './SOAVendorsCombinedSummary';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectEffectiveProductCode} from '@store/product/product.selectors';
import {getPartyLabels, isSid} from '@store/product/product.resolver';
import {formatIndianNumber} from '@utils/Utils';

const formatTotalInr = (n: number) =>
  `₹${formatIndianNumber(String(Number.isFinite(n) ? n : 0))}`;

export const SOADealerList: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const routeProgramId = (route.params as any)?.programId || '';
  const routeProgramIds = (route.params as any)?.programIds;
  const programName = (route.params as any)?.programName || 'Program name';
  const routePartyName = (route.params as any)?.partyName;
  const routeBankName = (route.params as any)?.bankName;
  const routeStatus = (route.params as any)?.status;
  // Web SID: "Debtor List of {anchor party}"; fall back to program name.
  const listOfName = routePartyName || programName;
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isDealerChecker = userRole === 'dealer_checker';
  const effectiveCode = useSelector(selectEffectiveProductCode);
  const {
    singular: partyLabel,
    plural: partyLabelPlural,
    nameLabel: partyNameLabel,
  } = getPartyLabels(effectiveCode);
  const isSidProduct = isSid(effectiveCode);
  // SID web: Escrow Account; DF/VF/PID: Loan/OD Account
  const odAccountLabel = isSidProduct ? 'Escrow Account' : 'Loan/OD Account';

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
  const programSummary = useSelector(programSummarySelector);
  const summaryLoading = useSelector(programSummaryLoadingSelector);
  const summaryError = useSelector(programSummaryErrorSelector);

  const columnTotals = useMemo(() => {
    return dealerList.reduce(
      (acc, row) => {
        acc.sanctionLimit += Number(row.sanctionLimitRaw) || 0;
        acc.utilizedAmount += Number(row.utilizedAmountRaw) || 0;
        acc.pipelineRequests += Number(row.pipelineRequestsRaw) || 0;
        acc.excessCredit += Number(row.excessCreditRaw) || 0;
        acc.availableLimit += Number(row.availableLimitRaw) || 0;
        acc.totalOsAmount += Number(row.totalOsAmountRaw) || 0;
        acc.totalAmountPaid += Number(row.totalAmountPaidRaw) || 0;
        return acc;
      },
      {
        sanctionLimit: 0,
        utilizedAmount: 0,
        pipelineRequests: 0,
        excessCredit: 0,
        availableLimit: 0,
        totalOsAmount: 0,
        totalAmountPaid: 0,
      },
    );
  }, [dealerList]);

  useEffect(() => {
    if (!dealerError) {
      return;
    }
    const lower = dealerError.toLowerCase();
    if (lower.includes('token expired') || lower.includes('unauthorized')) {
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Your token has expired. Please log in again.',
        visibilityTime: 4000,
      });
      return;
    }
    // SID: dealers 500 → empty list + summary card (no error toast; web parity).
    if (isSidProduct) {
      return;
    }
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: dealerError,
    });
  }, [dealerError, isSidProduct]);

  useEffect(() => {
    if (
      summaryError &&
      (summaryError.toLowerCase().includes('token expired') ||
        summaryError.toLowerCase().includes('unauthorized'))
    ) {
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Your token has expired. Please log in again.',
        visibilityTime: 4000,
      });
    } else if (summaryError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: summaryError,
      });
    }
  }, [summaryError]);

  // Fetch dealer list when selected program changes
  useEffect(() => {
    if (selectedProgramIds.length > 0) {
      dispatch(
        fetchDealerListRequest({
          programIds: selectedProgramIds,
          isInitialLoad: true,
          treatErrorAsEmpty: isSidProduct,
        }),
      );
      if (SHOW_SOA_VENDOR_LIST_PROGRAM_HEADER) {
        dispatch(
          fetchProgramSummaryRequest({
            programIds: selectedProgramIds,
          }),
        );
      }
    }
    return () => {
      dispatch(resetDealerState());
    };
  }, [dispatch, selectedProgramIds, isSidProduct]);

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
              <Text style={styles.infoLabel}>{odAccountLabel}</Text>
              <TouchableOpacity
                disabled={!programId}
                onPress={() =>
                  (navigation as any).navigate('CreditAccountDetails', {
                    id: item.id,
                    programId,
                    dealerName: item.counterPartyName,
                    creditAccount: item.odAccount,
                    anchor: programName,
                    partyName: routePartyName,
                    bankName: routeBankName,
                    status: item.status || routeStatus,
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
              <Text style={styles.infoLabel}>Total O/S Amount</Text>
              <Text style={styles.infoValue}>
                {item.totalOsAmount || '₹0.00'}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Total Amount Paid</Text>
              <Text style={styles.infoValue}>
                {item.totalAmountPaid || '₹0.00'}
              </Text>
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

  const renderListHeader = useCallback(
    () => (
      <View>
        {SHOW_SOA_VENDOR_LIST_PROGRAM_HEADER &&
        selectedProgramIds.length > 0 &&
        (summaryLoading || programSummary) ? (
          <SOAVendorListProgramHeader
            programName={programName}
            anchorName={programSummary?.loanDetails.anchorName ?? null}
            bankName={
              programSummary?.loanDetails.bankName ?? routeBankName ?? null
            }
            status={programSummary?.loanDetails.status ?? routeStatus ?? null}
            programApprovalDate={
              programSummary?.loanDetails.programApprovalDate ?? null
            }
            programExpiryDate={
              programSummary?.loanDetails.programExpiryDate ?? null
            }
            programLimit={programSummary?.loanDetails.programLimit ?? null}
            availableLimit={
              programSummary?.loanDetails.availableLimit ?? null
            }
            roiPercent={programSummary?.loanDetails.roiPercent ?? null}
            due={programSummary?.due ?? null}
            received={programSummary?.received ?? null}
            loading={summaryLoading}
          />
        ) : null}

        <View style={styles.dealersHeader}>
          <Text style={styles.dealersLabel}>{partyLabelPlural}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalDealers}</Text>
          </View>
        </View>

        <SOAVendorsCombinedSummary
          partyLabelPlural={partyLabelPlural}
          totals={columnTotals}
          formatInr={formatTotalInr}
        />
      </View>
    ),
    [
      columnTotals,
      partyLabelPlural,
      programName,
      programSummary,
      routeBankName,
      routeStatus,
      selectedProgramIds.length,
      summaryLoading,
      totalDealers,
    ],
  );

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
          {partyLabel} List of {listOfName}
        </Text>
      </View>

      <View style={styles.content}>
        {loading && <SkeletonList variant="card" count={4} />}

        {!loading && dealerList.length === 0 && isSidProduct && (
          <FlatList
            style={styles.list}
            data={[]}
            renderItem={() => null}
            keyExtractor={(_, index) => `sid-empty-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data</Text>
              </View>
            }
          />
        )}

        {!loading && dealerList.length === 0 && !isSidProduct && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {partyLabelPlural.toLowerCase()} found for {listOfName}
            </Text>
          </View>
        )}

        {!loading && dealerList.length > 0 && (
          <FlatList
            style={styles.list}
            data={dealerList}
            renderItem={renderDealerItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
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
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(16),
  },
  list: {
    flex: 1,
  },
  dealersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(8),
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
});
