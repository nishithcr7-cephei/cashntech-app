import React, {useMemo, useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import {
  AppBar,
  Container,
  ProgramBreadcrumb,
  CheckerApprovalModal,
  ApproveRejectModal,
  UploadModal,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';

import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {
  selectScopeData,
  selectProgramSelection,
  selectAllProgramIds,
} from '@store/programSelection/programSelection.selector';
import {fetchUserScopeRequest} from '@store/programSelection/programSelection.slice';
import {
  fetchInvoiceSummaryRequest,
  fetchLatestInvoicesRequest,
  selectInvoiceOverviewSummary,
  selectInvoiceOverviewSummaryLoading,
  selectInvoiceOverviewLatest,
  selectInvoiceOverviewLatestLoading,
  fetchInvoiceKpisRequest,
  selectInvoiceOverviewKpis,
  selectInvoiceOverviewKpisLoading,
} from '@store/invoiceOverview';
import type {Bank} from '@constants/programSelection';
import {formatDateDash} from '@screens/Invoice/InvoiceDetails/types';

// Format date as DD MMM YYYY (e.g., 15 Apr 2026)
const formatDateDDMmmYYYY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Return original if invalid
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return dateStr || '-';
  }
};
import {decryptValue} from '@utils/decrypt';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {selectPermissionsLoading} from '@store/permissions';

type ProductTabType = 'all_product' | 'dealer_finance' | 'vendor_finance' | 'pid';

const getCardMetrics = (
  productTab: ProductTabType,
  kpis?: {
    total_program_limit: string;
    utilized_amount: string;
    utilized_rate: string;
    active_dealer_ratio: string;
    available_limit: string;
    overdue_amount: string;
    dpd_days: string;
  } | null,
) => {
  const parsed = {
    totalLimit: parseFloat(kpis?.total_program_limit ?? '0') || 0,
    utilizedAmount: parseFloat(kpis?.utilized_amount ?? '0') || 0,
    utilizedRate: parseFloat(kpis?.utilized_rate ?? '0') || 0,
    activeDealerRatio: parseFloat(kpis?.active_dealer_ratio ?? '0') || 0,
    availableLimit: parseFloat(kpis?.available_limit ?? '0') || 0,
    overdueAmount: parseFloat(kpis?.overdue_amount ?? '0') || 0,
    dpdDays: parseFloat(kpis?.dpd_days ?? '0') || 0,
  };

  const formatCurrency = (amount: number) =>
    `₹ ${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  const formatPercentage = (value: number) =>
    `${value.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}%`;

  return [
    {label: 'Total Program Limit', value: formatCurrency(parsed.totalLimit)},
    {label: 'Utilized Amount', value: formatCurrency(parsed.utilizedAmount)},
    {label: 'Utilized Rate', value: formatPercentage(parsed.utilizedRate * 100)},
    {
      label: 'Active Dealer Ratio',
      value: formatPercentage(parsed.activeDealerRatio * 100),
    },
    {label: 'Available Limit', value: formatCurrency(parsed.availableLimit)},
    {label: 'Overdue Amount', value: formatCurrency(parsed.overdueAmount)},
    {label: 'DPD Days', value: parsed.dpdDays.toString()},
  ];
};

const getProgramIdsForTab = (
  tab: ProductTabType,
  banks: Bank[] | null,
): string[] => {
  if (!banks || banks.length === 0) return [];
  const ids: string[] = [];
  banks.forEach(bank => {
    bank.products.forEach(product => {
      const isDFProduct = product.name.toLowerCase().includes('dealer finance');
      product.programs.forEach(program => {
        const isDFProgram =
          program.name.toLowerCase().includes('df') ||
          program.name.toLowerCase().includes('dealer finance');
        const includeInAll = tab === 'all_product';
        const includeInDF =
          tab === 'dealer_finance' && (isDFProduct || isDFProgram);
        if (includeInAll || includeInDF) {
          ids.push(program.id);
        }
      });
    });
  });
  return Array.from(new Set(ids));
};


export const InvoiceDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const scopeData = useSelector(selectScopeData) as Bank[] | null;
  const programSelection = useSelector(selectProgramSelection);
  const allProgramIds = useSelector(selectAllProgramIds);
  const summaryData = useSelector(selectInvoiceOverviewSummary);
  const summaryLoading = useSelector(selectInvoiceOverviewSummaryLoading);
  const latestData = useSelector(selectInvoiceOverviewLatest);
  const latestLoading = useSelector(selectInvoiceOverviewLatestLoading);
  const kpis = useSelector(selectInvoiceOverviewKpis);
  const kpisLoading = useSelector(selectInvoiceOverviewKpisLoading);
  
  // Role-based visibility flags
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCashnTechUser = userRole === 'cashntech_user';

  const [activeTab, setActiveTab] = useState<'dealers' | 'unpaid'>('dealers');
  const [productTab, setProductTab] = useState<ProductTabType>('all_product');
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedDealerNo, setSelectedDealerNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  // Permissions
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canEdit = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const canDelete = useHasPermission(PERMISSIONS.INVOICE_LIST_DELETE);
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canAttachment = useHasPermission(PERMISSIONS.INVOICE_LIST_ATTACHMENT);
  const canPrint = useHasPermission(PERMISSIONS.INVOICE_LIST_PRINT);
  const canViewApprovalHistory = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVAL_HISTORY);

  const canShowApproveReject = canApprove || canReject;

  // Derived programIds based on program scope + active product tab
  // - selected scope  → single programId
  // - all scope       → all_product tab: all IDs; DF/VF/PID tab: filter by product type from scopeData
  // - fallback        → filter from scopeData by tab (e.g. when scope loads after landing)
  const programIds = useMemo(() => {
    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.programId
    ) {
      return [programSelection.programId];
    }
    if (
      programSelection?.programScope === 'all' &&
      allProgramIds &&
      allProgramIds.length > 0
    ) {
      if (productTab === 'all_product') {
        return allProgramIds;
      }
      // DF / VF / PID tab — filter by product type using scopeData mapping
      return getProgramIdsForTab(productTab, scopeData);
    }
    return getProgramIdsForTab(productTab, scopeData);
  }, [
    productTab,
    scopeData,
    programSelection?.programScope,
    programSelection?.programId,
    allProgramIds,
  ]);

  // Ensure scope is fetched once when missing so summary/latest can load
  useEffect(() => {
    if (!scopeData || scopeData.length === 0) {
      dispatch(fetchUserScopeRequest());
    }
  }, [dispatch, scopeData]);

  // Fetch summary/latest whenever we have programIds (including when scope loads after "All Program" land)
  useEffect(() => {
    if (!scopeData || scopeData.length === 0) return;

    if (
      programSelection?.programScope === 'selected' &&
      programIds.length === 0
    ) {
      return;
    }

    // Always use programIds for all API calls - it's already correctly calculated based on scope and product tab
    dispatch(fetchInvoiceSummaryRequest({programIds: programIds}));
    dispatch(fetchLatestInvoicesRequest({programIds: programIds}));
    dispatch(fetchInvoiceKpisRequest({programIds: programIds}));
  }, [dispatch, programIds, scopeData, programSelection?.programScope, productTab]);

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    void file;
    void selectedDealerId;
    setShowAttachmentModal(false);
    setSelectedDealerId(null);
  };

  // Dealer Checker: default to "Latest Invoice" tab
  React.useEffect(() => {
    if (userRole === 'dealer_checker') {
      setActiveTab('unpaid');
    }
  }, [userRole]);

  const dealerSummaryRows = useMemo(
    () =>
      (summaryData || []).map((row, index) => {
        const drawingPower = row.drawing_power != null
          ? row.drawing_power.toLocaleString('en-IN')
          : '-';
        const sanctionedLimit = row.sanctioned_limit != null
          ? row.sanctioned_limit.toLocaleString('en-IN')
          : '-';
        const utilisedAmount = row.utilized_amount != null
          ? row.utilized_amount.toLocaleString('en-IN')
          : '-';
        const available =
          row.sanctioned_limit != null && row.drawing_power != null
            ? (row.sanctioned_limit - row.drawing_power).toLocaleString(
                'en-IN',
              )
            : '-';
        const expiryDate = formatDateDDMmmYYYY(row.od_expiry_date);
        
        return {
          id: row.id || `dealer-${index}`,
          bankName: row.bank_name || '-',
          bankId: row.bank_id || '-',
          programName: row.program_name || '-',
          primaryParty: decryptValue(row.partyName || '') || '-',
          counterParty:
            row.counterPartyName != null
              ? decryptValue(row.counterPartyName) || '-'
              : '-',
          odAccount: decryptValue(row.od_account_no || '') || '-',
          drawingPower,
          sanctionedLimit,
          utilisedAmount,
          availableLimit: available,
          expiryDate,
          overdueAmount: '-',
          dpdDays: '-',
        };
      }),
    [summaryData],
  );

  const latestRows = useMemo(
    () =>
      (latestData || []).map((row, index) => ({
        id: row.id || `latest-${index}`,
        dealer:
          row.counterPartyName != null
            ? decryptValue(row.counterPartyName) || '-'
            : row.partyName != null
              ? decryptValue(row.partyName) || '-'
              : '-',
        invoiceNo: row.invoice_ref_no || '-',
        invoiceAmount: row.final_total ? `₹ ${parseFloat(row.final_total).toLocaleString('en-IN')}` : '-',
        invoiceDate: row.invoice_date ? formatDateDash(row.invoice_date) : '-',
        invoiceStatus: row.invoice_status || '-',
        approvalStatus: row.approval_status || '-',
        adminStatus: row.admin_status || '-',
        disbursementDate: row.disbursement_date ? formatDateDash(row.disbursement_date) : '-',
        disbAmount: row.disbursed_amount ? `₹ ${parseFloat(row.disbursed_amount).toLocaleString('en-IN')}` : '-',
        utrNo: row.utr_no || '-',
        invoiceDueDate: row.invoice_due_date || '-',
        loanRefNo: row.loan_ref_no || '',
      })),
    [latestData],
  );

  const filteredDealerRows = dealerSummaryRows;
  const filteredLatestRows = latestRows;

  const dealerTable = (
    <>
        {(isAnchorMaker || isDealerMaker || isCashnTechUser) && (
            <View style={styles.allProgramHeader}>
              <Text style={styles.allProgramTitle}>OD Accounts Summary</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {filteredDealerRows.length}
                </Text>
              </View>
            </View>
        )}

        {summaryLoading ? (
          <View style={[styles.verticalList, {justifyContent: 'center', alignItems: 'center', paddingVertical: scaleHeight(40)}]}>
            <ActivityIndicator
              size="large"
              color={Colors.primaryColor}
            />
          </View>
        ) : filteredDealerRows.length === 0 ? (
          <View style={[styles.verticalList, {justifyContent: 'center', alignItems: 'center', paddingVertical: scaleHeight(40)}]}>
            <Text style={styles.noDataText}>No OD Accounts available</Text>
          </View>
        ) : (
        <View style={styles.verticalList}>
          {filteredDealerRows.map((row, index) => (
            <View key={`${row.id}-${index}`} style={styles.cardWrapper}>
              <View style={styles.listCard}>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderContent}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{row.programName}</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      OD Account: {row.odAccount || '-'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Program Name</Text>
                    <Text style={styles.infoValue}>{row.programName}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Bank Name</Text>
                    <Text style={styles.infoValue}>{row.bankName}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Bank ID</Text>
                    <Text style={styles.infoValue}>{row.bankId}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>OD Account</Text>
                    <Text style={styles.infoValue}>{row.odAccount}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>OD Expiry Date</Text>
                    <Text style={styles.infoValue}>{row.expiryDate}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Primary Party</Text>
                    <Text style={styles.infoValue}>{row.primaryParty}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Counter Party</Text>
                    <Text style={styles.infoValue}>{row.counterParty}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Sanctioned Limit (₹)</Text>
                    <Text style={styles.infoValue}>{row.sanctionedLimit}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Utilized Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.utilisedAmount}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Drawing Power (₹)</Text>
                    <Text style={styles.infoValue}>{row.drawingPower}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Available Limit (₹)</Text>
                    <Text style={styles.infoValue}>{row.availableLimit}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Overdue Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.overdueAmount}</Text>
                  </View>

                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>DPD Days</Text>
                    <Text style={styles.infoValue}>{row.dpdDays}</Text>
                  </View>
                </View>
            </View>
            </View>
          ))}
        </View>
        )}
    </>
  );

  const unpaidTable = (
    <>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceBadgeContainer}>
              <Text style={styles.invoiceLabel}>Invoice List</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filteredLatestRows.length}</Text>
            </View>
          </View>
        </View>



        <View style={styles.verticalList}>
          {filteredLatestRows.map((row, index) => (
            <TouchableOpacity
              key={`${row.id}-${row.loanRefNo || 'ref'}-${index}`}
              style={styles.listCard}
              onPress={() => {
                navigation.navigate('InvoiceDetails', {
                  invoiceId: row.id,
                  dealerName: row.dealer,
                });
              }}>
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealer}</Text>
                  <Text style={styles.cardSubtitle}>
                    Invoice Number: {row.invoiceNo}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Date</Text>
                  <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disbursed Date</Text>
                  <Text style={styles.infoValue}>{row.disbursementDate}</Text>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Amount</Text>
                  <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disb. Amount</Text>
                  <Text style={styles.infoValue}>{row.disbAmount}</Text>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>UTR No.</Text>
                  <Text style={styles.infoValue}>{row.utrNo}</Text>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Status</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      (row.invoiceStatus || '').toLowerCase().includes('in progress')
                        ? styles.statusOrangeText
                        : (row.invoiceStatus || '').toLowerCase().includes('reject')
                          ? styles.statusRedText
                          : (row.invoiceStatus || '').toLowerCase().includes('completed') ||
                              (row.invoiceStatus || '').toLowerCase().includes('submitted') ||
                              (row.invoiceStatus || '').toLowerCase().includes('created') ||
                              (row.invoiceStatus || '').toLowerCase().includes('disbursed')
                            ? styles.statusGreenText
                            : undefined,
                    ]}>
                    {row.invoiceStatus}
                  </Text>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Approval Status</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      (row.approvalStatus || '').toLowerCase().includes('pending')
                        ? styles.statusOrangeText
                        : (row.approvalStatus || '').toLowerCase().includes('reject')
                          ? styles.statusRedText
                          : (row.approvalStatus || '').toLowerCase().includes('completed') ||
                              (row.approvalStatus || '').toLowerCase().includes('approval complete')
                            ? styles.statusGreenText
                            : undefined,
                    ]}>
                    {row.approvalStatus}
                  </Text>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Admin Status</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      (row.adminStatus || '').toLowerCase() === 'verified'
                        ? styles.statusGreenText
                        : undefined,
                    ]}>
                    {row.adminStatus}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
    </>
  );

  return (
    <Container>
      <AppBar
        title="Transactions > Invoice Overview"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView contentContainerStyle={styles.content}>
        {(isAnchorMaker || isDealerMaker || isCashnTechUser) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productTabsScroll}>
            <View style={styles.productTabsRow}>
              <TouchableOpacity
                style={[
                  styles.productTabBtn,
                  productTab === 'all_product' && styles.productTabBtnActive,
                ]}
                onPress={() => setProductTab('all_product')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.productTabText,
                    productTab === 'all_product' && styles.productTabTextActive,
                  ]}>
                  All Product
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.productTabBtn,
                  productTab === 'dealer_finance' && styles.productTabBtnActive,
                ]}
                onPress={() => setProductTab('dealer_finance')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.productTabText,
                    productTab === 'dealer_finance' && styles.productTabTextActive,
                  ]}>
                  Dealer Finance (DF)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {isDealerChecker && (
          <Text style={styles.sectionSubtitle}>Invoice</Text>
        )}
        {!isAnchorChecker && (
          <Text style={styles.keyFigureHeading}>Invoice Dashboard: Key Figure</Text>
        )}
        <View style={styles.cardGrid}>
          {getCardMetrics(productTab, kpis ?? undefined).map(card => (
            <View key={card.label} style={styles.card}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              {kpisLoading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.primaryColor}
                  style={styles.cardLoader}
                />
              ) : (
                <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                  {card.value}
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'dealers' && styles.activeTab]}
            onPress={() => setActiveTab('dealers')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'dealers' && styles.activeTabText,
              ]}>
              {(isAnchorMaker || isDealerMaker || isCashnTechUser) ? 'Summary of All Program' : 'Summary of Dealers'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'unpaid' && styles.activeTab]}
            onPress={() => setActiveTab('unpaid')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'unpaid' && styles.activeTabText,
              ]}>
              Latest Invoice
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {(summaryLoading || latestLoading) ? (
            <ActivityIndicator
              size="large"
              color={Colors.primaryColor}
              style={styles.loader}
            />
          ) : (
            activeTab === 'dealers' ? dealerTable : unpaidTable
          )}
        </View>
      </ScrollView>

      <CheckerApprovalModal
        visible={showCheckerApprovalModal}
        onClose={() => {
          setShowCheckerApprovalModal(false);
          setSelectedDealerId(null);
        }}
        approvalEntries={[
          {
            id: '1',
            approvedBy: 'Company Name_Checker',
            approvalDate: '01-02-2026',
            status: 'Approved',
          },
          {
            id: '2',
            approvedBy: 'Another Checker',
            approvalDate: '05-02-2026',
            status: 'Rejected',
          },
        ]}
      />

      <ApproveRejectModal
        visible={showApproveRejectModal}
        invoiceId={selectedDealerId}
        invoiceNo={selectedDealerNo || undefined}
        invoiceDetails={{
          subTotal: '10,80,025/-',
          withholdingTaxesPercent: '0.00/-',
          withholdingAmount: '0.00/-',
          finalPayableAmount: '10,80,025/-',
          finalDueDate: 'dd-mm-yyyy',
        }}
        onClose={() => {
          setShowApproveRejectModal(false);
          setSelectedDealerId(null);
          setSelectedDealerNo(null);
        }}
        onApprove={(dealerId, remarks) => {
          void remarks;
          setShowApproveRejectModal(false);
          const invoiceNo = selectedDealerNo || dealerId;
          (navigation as any).navigate('InvoiceDetailView', {
            invoiceId: dealerId,
            invoiceNo,
          });
          setSelectedDealerId(null);
          setSelectedDealerNo(null);
        }}
        onReject={(dealerId, remarks) => {
          void remarks;
          setSelectedDealerId(null);
          setSelectedDealerNo(null);
        }}
      />

      <UploadModal
        visible={showAttachmentModal}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={handleAttachmentUpload}
      />



    </Container>
  );
};

const styles = StyleSheet.create({
  loader: {
    marginTop: scaleHeight(40),
  },
  cardLoader: {
    marginTop: scaleHeight(8),
    alignSelf: 'flex-start',
  },
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
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
    gap: scaleHeight(12),
  },
  sectionSubtitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(8),
    marginTop: scaleHeight(12),
  },
  productTabsScroll: {
    marginTop: scaleHeight(6),
    marginBottom: scaleHeight(4),
  },
  productTabsRow: {
    flexDirection: 'row',
    gap: scaleWidth(18),
    paddingRight: scaleWidth(24),
  },
  productTabBtn: {
    paddingVertical: scaleHeight(8),
  },
  productTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryColor,
  },
  productTabText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  productTabTextActive: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  keyFigureHeading: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(10),
    marginTop: scaleHeight(4),
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  card: {
    flexBasis: '47%',
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: '#FFD9D9',
    minWidth: 0,
  },
  cardLabel: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
    flexWrap: 'wrap',
  },
  cardValue: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    flexShrink: 1,
    minWidth: 0,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F6FB',
    borderRadius: scaleWidth(20),
    padding: scaleWidth(4),
    marginTop: scaleHeight(16),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(16),
    alignItems: 'center',
  },
  tabText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  activeTab: {
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#00000022',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activeTabText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
  },
  tabContent: {
    marginTop: scaleHeight(18),
  },
  allProgramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  allProgramTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  searchBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    backgroundColor: Colors.white,
  },
  searchPlaceholder: {
    color: Colors.graybase,
    fontSize: scaleFont(14),
  },
  filterBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
  },
  filterText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  verticalList: {
    gap: scaleHeight(12),
  },
  cardWrapper: {
    position: 'relative',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    paddingRight: scaleWidth(50),
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardTitleChevron: {
    marginLeft: scaleWidth(6),
  },
  cardSubtitle: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginTop: scaleHeight(4),
  },
  statusChip: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    backgroundColor: '#E6F7EF',
  },
  statusChipText: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(12),
  },
  statusGreenText: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  statusOrangeText: {
    color: '#E86C00',
    fontFamily: Fonts.GilroySemiBold,
  },
  statusRedText: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  statusWarningChip: {
    backgroundColor: '#FFF4E0',
  },
  statusWarningText: {
    color: Colors.Yellow,
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
  invoiceHeader: {
    marginBottom: scaleHeight(12),
  },
  invoiceBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  invoiceLabel: {
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
  indexBadge: {
    backgroundColor: '#F7F8FB',
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  indexText: {
    color: Colors.graybase,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
  },
  noDataText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    textAlign: 'center',
  },
});

