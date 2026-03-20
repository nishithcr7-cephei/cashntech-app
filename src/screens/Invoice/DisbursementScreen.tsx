import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {
  AppBar,
  Container,
  FilterModal,
  ProgramBreadcrumb,
} from '@components/index';
import {MarkAsDisbursedModal} from './DisbursementScreen/MarkAsDisbursedModal';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Dots, Filter} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {invoiceApi} from '@services/api/invoice.api';
import {formatDateDash} from './InvoiceDetails/types';
import Toast from 'react-native-toast-message';
import {decryptValue} from '@utils/decrypt';

export type DisbursementRow = {
  id: string;
  loanRefNo: string;
  invoiceNo: string;
  bankName: string;
  productName: string;
  programName: string;
  primaryParty: string;
  counterParty: string;
  invoiceAmount: string;
  invoiceDate: string;
  dueDate: string;
  disburseDate: string;
  utrNo: string;
  invoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;
  finalTotal?: number;
  disbursedAmount?: number | null;
  bankId?: string;
  programId?: string;
  productId?: string;
  partyId?: string;
  counterPartyId?: string;
};

function mapToDisbursementRow(item: any): DisbursementRow {
  const finalTotal = item.final_total ?? item.finalTotal;
  const invoiceAmount =
    finalTotal != null
      ? `${Number(finalTotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/-`
      : '-';
  const bankName =
    item.bank_name ??
    item.program?.productConfig?.partnerBank?.bank_name ??
    '-';
  const productName =
    item.product_name ??
    item.program?.productConfig?.product?.name ??
    item.product?.name ??
    '-';
  const programName = item.program_name ?? item.program?.program_name ?? '-';
  const primaryParty =
    decryptValue(
      item.partyName ?? item.party?.entity_name ?? item.primary_party_name ?? '',
    ) || '-';
  const counterParty =
    decryptValue(
      item.counterPartyName ??
        item.anchorParticipantMapping?.party?.entity_name ??
        item.counter_party_name ??
        '',
    ) || '-';
  const bankId =
    item.partner_bank_id ??
    item.program?.productConfig?.partnerBank?.id ??
    item.partnerBank?.id;
  const programId = item.program_id ?? item.program?.id;
  const productId =
    item.program?.productConfig?.product?.id ??
    item.program?.productConfig?.product_id;
  const partyId = item.party_id ?? item.party?.id;
  const counterPartyId =
    item.anchorParticipantMapping?.party_id ??
    item.anchorParticipantMapping?.party?.id;
  return {
    id: item.id,
    loanRefNo: item.loan_ref_no ?? item.loanRefNo ?? '-',
    invoiceNo: item.invoice_ref_no ?? item.invoiceNo ?? '-',
    bankName,
    productName,
    programName,
    primaryParty,
    counterParty,
    bankId,
    programId,
    productId,
    partyId,
    counterPartyId,
    invoiceAmount,
    invoiceDate: formatDateDash(item.invoice_date ?? item.invoiceDate ?? ''),
    dueDate: formatDateDash(item.invoice_due_date ?? item.invoiceDueDate ?? ''),
    disburseDate: formatDateDash(
      item.disbursement_date ?? item.disbursementDate ?? '',
    ),
    utrNo: item.utr_no ?? item.utrNo ?? '-',
    invoiceStatus:
      item.invoice_status ??
      item.invoiceStatus ??
      (item.disbursement_date || item.disbursed_amount ? 'Disbursed' : ''),
    approvalStatus: item.approval_status ?? item.approvalStatus ?? '',
    adminStatus: item.admin_status ?? item.adminStatus ?? '',
    finalTotal: finalTotal != null ? Number(finalTotal) : undefined,
    disbursedAmount: item.disbursed_amount ?? item.disbursedAmount ?? null,
  };
}

export const DisbursementScreen: React.FC = () => {
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const programSelection = useSelector(selectProgramSelection);
  const programName =
    programSelection?.programScope === 'all'
      ? 'All Program'
      : programSelection?.programName ?? 'Sun Pharma PGM';
  const isCashnTechUser = userRole === 'cashntech_user';
  const showDisbursementActionMenu = isCashnTechUser;

  const [disbursementRows, setDisbursementRows] = useState<DisbursementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const [showDisbursedModal, setShowDisbursedModal] = useState(false);
  const [selectedDisbursementId, setSelectedDisbursementId] = useState<string | null>(null);
  const [mailLoadingId, setMailLoadingId] = useState<string | null>(null);
  const menuButtonRefs = useRef<Record<string, any>>({});

  const programIds = useMemo(
    () =>
      programSelection?.programScope === 'all' &&
      programSelection?.allProgramIds?.length
        ? programSelection.allProgramIds
        : programSelection?.programId
        ? [programSelection.programId]
        : undefined,
    [
      programSelection?.programScope,
      programSelection?.programId,
      programSelection?.allProgramIds,
    ],
  );

  const fetchDisbursementData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = appliedFilters;
      let apiFilters: Parameters<typeof invoiceApi.getVerifiedList>[1] = undefined;
      if (Object.keys(filters).length > 0) {
        const bankIds = filters['Bank Name']?.length
          ? [...new Set(disbursementRows.filter(r => filters['Bank Name']!.includes(r.bankName)).map(r => r.bankId).filter(Boolean) as string[])]
          : undefined;
        const programIdsFilter = filters['Program Name']?.length
          ? [...new Set(disbursementRows.filter(r => filters['Program Name']!.includes(r.programName)).map(r => r.programId).filter(Boolean) as string[])]
          : undefined;
        const productIds = filters['Product Name']?.length
          ? [...new Set(disbursementRows.filter(r => filters['Product Name']!.includes(r.productName)).map(r => r.productId).filter(Boolean) as string[])]
          : undefined;
        const partyIds = filters['Primary Party']?.length
          ? [...new Set(disbursementRows.filter(r => filters['Primary Party']!.includes(r.primaryParty)).map(r => r.partyId).filter(Boolean) as string[])]
          : undefined;
        const counterPartyIds = filters['Counter Party']?.length
          ? [...new Set(disbursementRows.filter(r => filters['Counter Party']!.includes(r.counterParty)).map(r => r.counterPartyId).filter(Boolean) as string[])]
          : undefined;
        const byInvoiceStatus = filters['Invoice Status']?.length ? filters['Invoice Status'] : undefined;
        if (bankIds || programIdsFilter || productIds || partyIds || counterPartyIds || byInvoiceStatus) {
          apiFilters = {
            bankIds,
            programIds: programIdsFilter,
            productIds,
            partyIds,
            counterPartyIds,
            byInvoiceStatus,
          };
        }
      }
      const verifiedList = await invoiceApi.getVerifiedList(programIds, apiFilters);
      const allowedStatuses = [
        'submitted',
        'in progress',
        'inprogress',
        'disbursed',
        'paid',
      ];
      let verifiedItems = (verifiedList || []).filter(
        (item: any) => {
          const adminStatus = (item.admin_status || '').toLowerCase();
          if (adminStatus !== 'verified') return false;
          const status = (item.invoice_status || '').toLowerCase();
          return allowedStatuses.includes(status) || !!item.disbursement_date || !!item.disbursed_amount;
        },
      );
      if (apiFilters?.byInvoiceStatus?.length) {
        verifiedItems = verifiedItems.filter((item: any) =>
          apiFilters!.byInvoiceStatus!.some(
            s => (item.invoice_status || '').toLowerCase() === s.toLowerCase(),
          ),
        );
      }
      // Preserve backend order (created_at DESC) – don't re-sort here
      let rows = verifiedItems.map(mapToDisbursementRow);
      // CashnTech user: only Disbursed, Submitted, Paid
      const cashntechStatuses = ['disbursed', 'submitted', 'paid'];
      const finalRows = isCashnTechUser
        ? rows.filter(r =>
            cashntechStatuses.includes((r.invoiceStatus || '').toLowerCase()),
          )
        : rows;
      setDisbursementRows(finalRows);
    } catch (err: any) {
      const msg =
        err?.message?.includes('fetch') || err?.code === 'ECONNABORTED'
          ? 'Network error. Check connection.'
          : err?.message || 'Failed to load disbursement data';
      setError(msg);
      setDisbursementRows([]);
    } finally {
      setLoading(false);
    }
  }, [programIds, isCashnTechUser, appliedFilters]);

  useEffect(() => {
    fetchDisbursementData();
  }, [fetchDisbursementData]);

  // Client-side metrics from /invoice/verified/list data (backend returns final_total, disbursed_amount)
  const totalDisbursedAmount = disbursementRows.reduce(
    (sum, r) => sum + (r.disbursedAmount ?? 0),
    0,
  );
  const totalInvoiceAmount = disbursementRows.reduce(
    (sum, r) => sum + (r.finalTotal ?? 0),
    0,
  );
  const pendingDisAmount = disbursementRows.reduce(
    (sum, r) => sum + Math.max(0, (r.finalTotal ?? 0) - (r.disbursedAmount ?? 0)),
    0,
  );
  const utilizationPct =
    totalInvoiceAmount > 0
      ? ((totalDisbursedAmount / totalInvoiceAmount) * 100).toFixed(2)
      : '0.00';
  const disbursementMetrics = [
    {
      label: 'Total Dis Amount',
      value: `₹ ${totalDisbursedAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`,
    },
    {label: 'Total Invoices', value: String(disbursementRows.length)},
    {
      label: 'Pending Dis Amount',
      value: `₹ ${pendingDisAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`,
    },
    {
      label: 'Repeated Usage',
      value: `${utilizationPct}%`,
    },
  ];

  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  const banksFilter = [...new Set(disbursementRows.map(r => r.bankName).filter(Boolean))].sort();
  const productsFilter = [...new Set(disbursementRows.map(r => r.productName).filter(Boolean))].sort();
  const programsFilter = [...new Set(disbursementRows.map(r => r.programName).filter(Boolean))].sort();
  const statusesFilter = [...new Set(disbursementRows.map(r => r.invoiceStatus).filter(Boolean))].sort();
  const primaryPartiesFilter = [...new Set(disbursementRows.map(r => r.primaryParty).filter(Boolean))].sort();
  const counterPartiesFilter = [...new Set(disbursementRows.map(r => r.counterParty).filter(Boolean))].sort();
  const disbursementFilterData = {
    'Bank Name': banksFilter.length ? banksFilter : ['No data'],
    'Product Name': productsFilter.length ? productsFilter : ['No data'],
    'Program Name': programsFilter.length ? programsFilter : ['No data'],
    'Invoice Status': statusesFilter.length ? statusesFilter : ['No data'],
    'Primary Party': primaryPartiesFilter.length ? primaryPartiesFilter : ['No data'],
    'Counter Party': counterPartiesFilter.length ? counterPartiesFilter : ['No data'],
  };

  const filteredData = !searchText.trim()
    ? disbursementRows
    : disbursementRows.filter(item => {
        const term = searchText.toLowerCase();
        return (
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.counterParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term)
        );
      });

  const [visibleCount, setVisibleCount] = useState(30);
  useEffect(() => {
    setVisibleCount(30);
  }, [searchText, appliedFilters]);
  const paginatedData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 20, filteredData.length));
  }, [filteredData.length]);

  const handleMenuToggle = (disbursementId: string) => {
    if (openMenuId === disbursementId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const ref = menuButtonRefs.current[disbursementId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(disbursementId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(disbursementId);
    }
  };

  const handleMenuAction = async (action: string, disbursementId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    switch (action) {
      case 'markAsDisbursed':
        setSelectedDisbursementId(disbursementId);
        setShowDisbursedModal(true);
        break;
      case 'sendMail':
        const invoiceNoForMail = disbursementRows.find(r => r.id === disbursementId)?.invoiceNo;
        Alert.alert(
          'Mail to Bank',
          `Are you sure you want to mail to bank for invoice ${invoiceNoForMail || disbursementId}?`,
          [
            {text: 'Cancel', style: 'cancel', onPress: () => {}},
            {
              text: 'Yes',
              onPress: async () => {
                setMailLoadingId(disbursementId);
                try {
                  await invoiceApi.mailToBank(disbursementId);
                  Toast.show({
                    type: 'success',
                    text1: 'Invoice submitted for disbursement successfully',
                    visibilityTime: 3000,
                  });
                  fetchDisbursementData();
                } catch (err: any) {
                  Toast.show({
                    type: 'error',
                    text1: err?.message || 'Failed to submit for disbursement',
                    visibilityTime: 3000,
                  });
                } finally {
                  setMailLoadingId(null);
                }
              },
            },
          ],
        );
        break;
      case 'delete':
        // TODO: Delete - not implemented in backend
        break;
    }
  };

  const getMenuPosition = (anchor: {x: number; y: number; width: number; height: number} | null) => {
    const screen = Dimensions.get('window');
    const menuWidth = scaleWidth(180);
    const horizontalPadding = scaleWidth(12);
    const topPadding = scaleHeight(8);
    if (!anchor) {
      return {position: 'absolute' as const, top: topPadding + scaleHeight(60), right: horizontalPadding};
    }
    const desiredLeft = anchor.x + anchor.width - menuWidth;
    const left = Math.max(horizontalPadding, Math.min(desiredLeft, screen.width - menuWidth - horizontalPadding));
    return {position: 'absolute' as const, top: anchor.y + anchor.height + topPadding, left};
  };


  const renderDisbursementRow = ({item: row}: {item: DisbursementRow}) => (
    <View style={styles.cardWrapper}>
      <View style={styles.listCard}>
        {isCashnTechUser && (
          <View
            ref={(r: View | null) => {
              if (r) menuButtonRefs.current[row.id] = r;
            }}
            collapsable={false}
            style={styles.threeDotsButton}>
            <TouchableOpacity
              onPress={() => handleMenuToggle(row.id)}
              activeOpacity={0.7}
              style={styles.threeDotsTouchable}>
              <Dots
                width={scaleWidth(20)}
                height={scaleHeight(20)}
                style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Loan Ref No.</Text>
            <Text style={styles.infoValue}>{row.loanRefNo}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice No.</Text>
            <Text style={styles.infoValue}>{row.invoiceNo}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{row.bankName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Product Name</Text>
            <Text style={styles.infoValue}>{row.productName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Program Name</Text>
            <Text style={styles.infoValue}>{row.programName}</Text>
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
            <Text style={styles.infoLabel}>Invoice Amount</Text>
            <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{row.invoiceDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{row.dueDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Disbur Date</Text>
            <Text style={styles.infoValue}>{row.disburseDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>UTR No.</Text>
            <Text style={styles.infoValue}>{row.utrNo}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Status</Text>
            <Text style={[styles.infoValue, styles.statusGreen]}>{row.invoiceStatus}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Container>
      <AppBar
        title="Transactions > Disbursement"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.content}
        data={loading ? [] : paginatedData}
        keyExtractor={row => row.id}
        ListHeaderComponent={
          <>
            <View style={styles.pageTitleBar}>
              <Text style={styles.pageTitleText}>{programName}</Text>
            </View>
            <View style={styles.cardGrid}>
              {disbursementMetrics.map((metric, index) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.cardLabel}>{metric.label}</Text>
                  <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading disbursement data...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchDisbursementData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {!loading && (
              <>
                <View style={styles.invoicesHeader}>
                  <Text style={styles.invoicesLabel}>Verified Invoices</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{filteredData.length}</Text>
                  </View>
                </View>
                <View style={styles.searchFilterRow}>
                  <View style={styles.searchContainer}>
                    <Search width={scaleWidth(18)} height={scaleHeight(18)} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search Entity"
                      placeholderTextColor={Colors.graybase}
                      value={searchText}
                      onChangeText={setSearchText}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilterModal(true)}>
                    <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
                    <Text style={styles.filterButtonText}>Filters</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={{height: scaleHeight(12)}} />}
        renderItem={renderDisbursementRow}
        ListEmptyComponent={
          !loading && !error && filteredData.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No verified invoices found</Text>
            </View>
          ) : null
        }
        onEndReached={!loading && hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}
        ListFooterComponent={
          !loading && hasMore ? (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      {/* 3-dot Action Menu - Disbursal list view: Checker & CashnTech User - Send Mail to Bank, Mark as Disbursed, Delete */}
      {showDisbursementActionMenu && (
        <Modal
          transparent
          visible={!!openMenuId}
          animationType="fade"
          onRequestClose={() => {
            setOpenMenuId(null);
            setMenuAnchor(null);
          }}>
          <Pressable
            style={styles.menuOverlay}
            onPress={() => {
              setOpenMenuId(null);
              setMenuAnchor(null);
            }}>
            <Pressable
              style={[styles.actionMenu, getMenuPosition(menuAnchor)]}
              onPress={() => {}}
            >
              {(() => {
                const selectedRow = filteredData.find(r => r.id === openMenuId);
                const status = (selectedRow?.invoiceStatus || '').toLowerCase();
                const isDisbursed = status === 'disbursed';
                return (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuAction('sendMail', openMenuId as string)}>
                      <FontAwesome6 name="envelope" iconStyle="regular" color={Colors.darkblack} size={16} />
                      <Text style={styles.menuItemText}>Send Mail to Bank</Text>
                    </TouchableOpacity>
                    {!isDisbursed && (
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleMenuAction('markAsDisbursed', openMenuId as string)}>
                        <FontAwesome6 name="money-bill-1" iconStyle="regular" color={Colors.darkblack} size={16} />
                        <Text style={styles.menuItemText}>Mark as Disbursed</Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
        }}
        filterData={disbursementFilterData}
        appliedFilters={appliedFilters}
      />

      {/* Mark as Disbursed Modal */}
      <MarkAsDisbursedModal
        visible={showDisbursedModal}
        onClose={() => {
          setShowDisbursedModal(false);
          setSelectedDisbursementId(null);
        }}
        invoiceId={selectedDisbursementId ?? undefined}
        invoiceAmount={
          filteredData.find(item => item.id === selectedDisbursementId)?.invoiceAmount?.replace(/[,/-]/g, '').trim() || '0'
        }
        invoiceNo={
          filteredData.find(item => item.id === selectedDisbursementId)?.invoiceNo
        }
        onSubmit={async data => {
          if (!selectedDisbursementId) return;
          try {
            const amount = parseFloat(
              (data.disbursedAmount || '0').replace(/[,\s₹]/g, ''),
            );
            const dateParts = (data.date || '').split('-');
            const disbursementDate =
              dateParts.length === 3
                ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
                : data.date;
            const isDisbursed = (data.status || '').toLowerCase() === 'disbursed';
            await invoiceApi.markAsDisbursed(selectedDisbursementId, {
              utr_no: data.utrNo || '',
              transaction_no: data.transactionNo || '',
              disbursed_amount: isDisbursed && !isNaN(amount) ? amount : 0,
              disbursement_date: disbursementDate || new Date().toISOString().slice(0, 10),
              status: data.status || 'Disbursed',
              remark: data.remark || '',
            });
            Toast.show({
              type: 'success',
              text1: 'Invoice marked as disbursed successfully',
              visibilityTime: 3000,
            });
            setShowDisbursedModal(false);
            setSelectedDisbursementId(null);
            fetchDisbursementData();
          } catch (err: any) {
            Toast.show({
              type: 'error',
              text1: err?.message || 'Failed to mark as disbursed',
              visibilityTime: 3000,
            });
          }
        }}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    marginBottom: scaleHeight(8),
    marginHorizontal: -scaleWidth(16),
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(16),
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
  invoicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  invoicesLabel: {
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
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
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
    paddingRight: scaleWidth(50),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  threeDotsTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionMenu: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    minWidth: scaleWidth(180),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  menuItemText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  menuItemTextDanger: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
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
  loadingContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    gap: scaleHeight(12),
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  loadMoreFooter: {
    paddingVertical: scaleHeight(16),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  loadMoreText: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  errorContainer: {
    paddingVertical: scaleHeight(24),
    alignItems: 'center',
    gap: scaleHeight(12),
  },
  errorText: {
    fontSize: scaleFont(14),
    color: Colors.red,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
  },
  retryButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
