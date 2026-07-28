import React, {useEffect, useState, useMemo} from 'react';
import moment from 'moment';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatIndianNumber} from '@utils/Utils';
import {Search, Filter, LeftChevron} from '@assets/Icons';
import {fetchCreditAccountDetailsRequest, resetCreditAccountDetails} from './slice';
import {
  selectProgramSummary,
  selectDealerListDetails,
  selectCreditAccountDetailsLoading,
  selectCreditAccountDetailsError,
  selectTransactionList,
  selectOpenInvoiceList,
  selectClosedInvoiceList,
  selectRepaymentList,
  selectOpenInvoiceMessage,
  selectClosedInvoiceMessage,
  selectRepaymentMessage,
} from './selector';
import {selectEffectiveProductCode} from '@store/product/product.selectors';
import {PRODUCT_CODES} from '@store/product/product.types';

const TABS = [
  'OD Account Summary',
  'Transaction Details',
  'Open Invoice',
  'Closed Invoice',
  'Repayment',
];

export const CreditAccountDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [searchText, setSearchText] = useState('');

  // Extract params
  const id = (route.params as any)?.id;
  const programId = (route.params as any)?.programId;
  const dealerName = (route.params as any)?.dealerName || 'Dealer';
  const programName = (route.params as any)?.anchor || 'Program';
  const effectiveProductCode = useSelector(selectEffectiveProductCode);
  const partyLabel =
    effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE
      ? 'Vendor Name'
      : 'Dealer Name';

  // Redux state
  const summary = useSelector(selectProgramSummary);
  const dealers = useSelector(selectDealerListDetails) || [];
  const loading = useSelector(selectCreditAccountDetailsLoading);
  const error = useSelector(selectCreditAccountDetailsError);
  const transactions = useSelector(selectTransactionList) || [];
  const openInvoices = useSelector(selectOpenInvoiceList) || [];
  const closedInvoices = useSelector(selectClosedInvoiceList) || [];
  const repayments = useSelector(selectRepaymentList) || [];
  const openMessage = useSelector(selectOpenInvoiceMessage);
  const closedMessage = useSelector(selectClosedInvoiceMessage);
  const repaymentMessage = useSelector(selectRepaymentMessage);

  useEffect(() => {
    const backAction = () => {
      (navigation as any).navigate('SOADealerList', {
        programId,
        anchor: programName,
      });
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    if (id && programId) {
      dispatch(fetchCreditAccountDetailsRequest({id, programId}));
    }
    return () => {
      dispatch(resetCreditAccountDetails());
    };
  }, [id, programId, dispatch]);

  const filteredDealers = useMemo(() => {
    if (!searchText.trim()) return dealers;
    const term = searchText.toLowerCase();
    return dealers.filter(
      item =>
        item.od_account_no?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term),
    );
  }, [dealers, searchText]);

  const renderDealerCard = (item: any, index: number) => {
    const isDebitFreeze = item.status?.toLowerCase() === 'debit freeze';

    return (
      <View key={item.id || index} style={styles.cardWrapper}>
        <View style={styles.listCard}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>

          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>{item.od_account_no || 'N/A'}</Text>
              <Text style={styles.cardSubtitle}>
                 Loan / OD Account Summary
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Sanction Amount</Text>
              <Text style={styles.infoValue}>₹{formatIndianNumber(String(item.sanctioned_limit || 0))}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>ROI</Text>
              <Text style={styles.infoValue}>
                {item.interest_parameters?.interest_slabs?.[0]?.total_roi_percent || 0}%
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Tenure</Text>
              <Text style={styles.infoValue}>{item.default_payment_terms_days || 0} Days</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>
                {item.limit_approval_date ? moment(item.limit_approval_date).format('DD-MM-YYYY') : '-'}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>
                {item.od_expiry_date ? moment(item.od_expiry_date).format('DD-MM-YYYY') : '-'}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Status</Text>
              <View
                style={[
                  styles.statusBadgeInline,
                  isDebitFreeze ? styles.statusBadgeRed : styles.statusBadgeGreen,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    isDebitFreeze ? styles.statusTextRed : styles.statusTextGreen,
                  ]}>
                  {item.status || 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTransactionCard = (item: any, index: number) => (
    <View key={`${item.id}-${index}`} style={styles.cardWrapper}>
      <View style={styles.listCard}>
        <View style={styles.indexBadge}><Text style={styles.indexText}>{index + 1}</Text></View>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Txn Date</Text>
            <Text style={styles.infoValue}>{item.txn_date || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Ref No</Text>
            <Text style={styles.infoValue}>{item.invoice_no || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Particulars</Text>
            <Text style={styles.infoValue}>{item.particulars || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Debit</Text>
            <Text style={styles.infoValue}>{item.debit || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Credit</Text>
            <Text style={styles.infoValue}>{item.credit || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>O/S Principal Amount</Text>
            <Text style={styles.infoValue}>{item.os_principal || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>O/S Interest Accrued Amount</Text>
            <Text style={styles.infoValue}>{item.os_interest || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>O/S Penal Amount (₹)</Text>
            <Text style={styles.infoValue}>{item.os_penal || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>O/S Total Amount</Text>
            <Text style={styles.infoValue}>{item.os_total || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Due Other Charges</Text>
            <Text style={styles.infoValue}>{item.due_other_charges || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Paid Other Charges</Text>
            <Text style={styles.infoValue}>{item.paid_other_charges || '-'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderOpenInvoiceCard = (item: any, index: number) => (
    <View key={`${item.tranch_loan_no}-${index}`} style={styles.cardWrapper}>
      <View style={styles.listCard}>
        <View style={styles.indexBadge}><Text style={styles.indexText}>{index + 1}</Text></View>
        <View style={styles.infoGrid}>
          <View style={[styles.infoColumn, {width: '100%', marginBottom: scaleHeight(8)}]}>
            <Text style={styles.infoLabel}>Tranch/Loan No</Text>
            <Text style={styles.infoValue}>{item.tranch_loan_no || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValue}>{item.invoice_no || 'N/A'}</Text>
          </View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Loan Amount</Text><Text style={styles.infoValue}>{item.loan_amount || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Disbursement Date</Text><Text style={styles.infoValue}>{item.loan_date || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Principal O/S Amo.</Text><Text style={styles.infoValue}>{item.principal_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Interest O/S Amo.</Text><Text style={styles.infoValue}>{item.interest_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Penal Interest O/S</Text><Text style={styles.infoValue}>{item.penal_interest_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Other Charges O/S</Text><Text style={styles.infoValue}>{item.other_charges_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Principal</Text><Text style={styles.infoValue}>{item.paid_principal || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Interest</Text><Text style={styles.infoValue}>{item.paid_interest || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Penal Interest</Text><Text style={styles.infoValue}>{item.paid_penal_interest || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Other Charges</Text><Text style={styles.infoValue}>{item.paid_other_charges || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Due Date</Text><Text style={styles.infoValue}>{item.due_date || '-'}</Text></View>
          <View style={styles.infoColumn}>
             <Text style={styles.infoLabel}>Status</Text>
             <Text style={[styles.statusBadgeText, {color: Colors.primaryColor}]}>{item.status || '-'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderClosedInvoiceCard = (item: any, index: number) => (
    <View key={`${item.tranch_loan_no}-${index}`} style={styles.cardWrapper}>
      <View style={styles.listCard}>
        <View style={styles.indexBadge}><Text style={styles.indexText}>{index + 1}</Text></View>
        <View style={styles.infoGrid}>
          <View style={[styles.infoColumn, {width: '100%', marginBottom: scaleHeight(8)}]}>
            <Text style={styles.infoLabel}>Tranch/Loan No</Text>
            <Text style={styles.infoValue}>{item.tranch_loan_no || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValue}>{item.invoice_no || 'N/A'}</Text>
          </View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Loan Amount</Text><Text style={styles.infoValue}>{item.loan_amount || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Loan Date</Text><Text style={styles.infoValue}>{item.loan_date || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Principal O/S Amo.</Text><Text style={styles.infoValue}>{item.principal_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Interest O/S Amo.</Text><Text style={styles.infoValue}>{item.interest_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Penal Interest O/S</Text><Text style={styles.infoValue}>{item.penal_interest_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Other Charges O/S</Text><Text style={styles.infoValue}>{item.other_charges_os || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Principal</Text><Text style={styles.infoValue}>{item.paid_principal || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Interest</Text><Text style={styles.infoValue}>{item.paid_interest || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Penal Interest</Text><Text style={styles.infoValue}>{item.paid_penal_interest || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Paid Other Charges</Text><Text style={styles.infoValue}>{item.paid_other_charges || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>No of Days</Text><Text style={styles.infoValue}>{item.no_of_days || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Closed Date</Text><Text style={styles.infoValue}>{item.closed_date || '-'}</Text></View>
        </View>
      </View>
    </View>
  );

  const renderRepaymentCard = (item: any, index: number) => (
    <View key={`${item.transaction_no}-${index}`} style={styles.cardWrapper}>
      <View style={styles.listCard}>
        <View style={styles.indexBadge}><Text style={styles.indexText}>{index + 1}</Text></View>
        <View style={styles.infoGrid}>
          <View style={[styles.infoColumn, {width: '100%', marginBottom: scaleHeight(8)}]}>
            <Text style={styles.infoLabel}>Transaction No.</Text>
            <Text style={styles.infoValue}>{item.transaction_no || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValue}>{item.invoice_no || 'N/A'}</Text>
          </View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{item.date || '-'}</Text></View>
          <View style={[styles.infoColumn, {width: '100%'}]}><Text style={styles.infoLabel}>Particulars</Text><Text style={styles.infoValue}>{item.particulars || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Amount</Text><Text style={styles.infoValue}>{item.amount || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Transaction Mode</Text><Text style={styles.infoValue}>{item.transaction_mode || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Debit</Text><Text style={styles.infoValue}>{item.debit || '-'}</Text></View>
          <View style={styles.infoColumn}><Text style={styles.infoLabel}>Credit</Text><Text style={styles.infoValue}>{item.credit || '-'}</Text></View>
          <View style={[styles.infoColumn, {width: '100%'}]}><Text style={styles.infoLabel}>Remark</Text><Text style={styles.infoValue}>{item.remark || '-'}</Text></View>
        </View>
      </View>
    </View>
  );

  if (loading && !summary && !dealers.length) {
    return (
      <Container>
        <AppBar 
          title="Transactions > Statement of Account (SOA)" 
          navigation={navigation as any} 
          hideHamburger={true}
          renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
          onPressLeftIcon={() => 
            (navigation as any).navigate('SOADealerList', {
              programId,
              anchor: programName,
            })
          }
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.loadingText}>Fetching details...</Text>
        </View>
      </Container>
    );
  }

  if (error && !summary) {
    return (
      <Container>
        <AppBar 
          title="Transactions > Statement of Account (SOA)" 
          navigation={navigation as any} 
          hideHamburger={true}
          renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
          onPressLeftIcon={() => 
            (navigation as any).navigate('SOADealerList', {
              programId,
              anchor: programName,
            })
          }
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>Oops! Something went wrong.</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => id && programId && dispatch(fetchCreditAccountDetailsRequest({id, programId}))}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }
  return (
    <Container>
      <AppBar 
        title="Transactions > Statement of Account (SOA)" 
        navigation={navigation as any} 
        hideHamburger={true}
        renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
        onPressLeftIcon={() => 
          (navigation as any).navigate('SOADealerList', {
            programId,
            anchor: programName,
          })
        }
      />
      
      <ScrollView
        stickyHeaderIndices={[2]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <View style={styles.pageTitleBar}>
          <Text
            style={styles.pageTitleText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}>
            Credit Account Details of {dealerName}
          </Text>
        </View>

        {/* Top Summary Card - Program Summary */}
        {summary && (
          <View style={styles.headerSummaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Credit Account No</Text>
              <Text style={styles.summaryValue}>{summary.account_number || '-'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Anchor</Text>
              <Text style={styles.summaryValue}>{summary.entity_name || programName || '-'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Sanctioned Limit</Text>
              <Text style={styles.summaryValue}>₹ {formatIndianNumber(String(summary.total_limit || 0))}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Utilized Amount</Text>
              <Text style={styles.summaryValue}>₹ {formatIndianNumber(String(summary.utilized_amount || 0))}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Available Limit</Text>
              <Text style={styles.summaryValue}>
                ₹ {formatIndianNumber(String(
                  Number(summary.total_limit || 0) -
                    Number(summary.utilized_amount || 0) -
                    Number(summary.pipeline_requests || 0),
                ))}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Outstanding</Text>
              <Text style={styles.summaryValue}>₹ {formatIndianNumber(String(summary.total_outstanding || 0))}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Overdue Days</Text>
              <Text style={styles.summaryValue}>{summary.overdue_days ?? 0}</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            {TABS.map(tab => (
              <TouchableOpacity key={tab} style={styles.tabLink} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabLinkText, activeTab === tab && styles.activeTabLinkText]}>{tab}</Text>
                {activeTab === tab && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.mainContent}>
          {/* Dealer Count Header */}
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceBadgeContainer}>
              <Text style={styles.invoiceLabel}>{partyLabel} - {dealerName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {activeTab === 'OD Account Summary' ? dealers.length : 
                   activeTab === 'Transaction Details' ? transactions.length : 
                   activeTab === 'Open Invoice' ? openInvoices.length : 
                   activeTab === 'Closed Invoice' ? closedInvoices.length : 
                   repayments.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Search & Filters */}
          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Search width={scaleWidth(18)} height={scaleHeight(18)} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by invoice no"
                placeholderTextColor={Colors.graybase}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
              <Text style={styles.filterBtnText}>Filters</Text>
            </TouchableOpacity>
          </View>

          {/* List View - Vertical Cards */}
          <View style={styles.listView}>
            {activeTab === 'OD Account Summary' && (
              filteredDealers.length > 0 ? (
                filteredDealers.map((item, index) => renderDealerCard(item, index))
              ) : (
                <View style={styles.emptyState}><Text style={styles.emptyText}>No dealers found</Text></View>
              )
            )}
            
            {activeTab === 'Transaction Details' && (
              transactions.length > 0 ? (
                transactions.map((item, index) => renderTransactionCard(item, index))
              ) : (
                <View style={styles.emptyState}><Text style={styles.emptyText}>No transactions found</Text></View>
              )
            )}

            {activeTab === 'Open Invoice' && (
              openInvoices.length > 0 ? (
                openInvoices.map((item, index) => renderOpenInvoiceCard(item, index))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{openMessage || 'No open invoices found'}</Text>
                </View>
              )
            )}

            {activeTab === 'Closed Invoice' && (
              closedInvoices.length > 0 ? (
                closedInvoices.map((item, index) => renderClosedInvoiceCard(item, index))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No Data Found</Text>
                </View>
              )
            )}

            {activeTab === 'Repayment' && (
              repayments.length > 0 ? (
                repayments.map((item, index) => renderRepaymentCard(item, index))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No Data Found</Text>
                </View>
              )
            )}

            {activeTab !== 'OD Account Summary' && 
             activeTab !== 'Transaction Details' && 
             activeTab !== 'Open Invoice' && 
             activeTab !== 'Closed Invoice' && 
             activeTab !== 'Repayment' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No data for {activeTab}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: scaleHeight(40) },
  pageTitleBar: { paddingHorizontal: scaleWidth(16), paddingVertical: scaleHeight(12), backgroundColor: Colors.white },
  pageTitleText: { fontSize: scaleFont(13), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  headerSummaryGrid: { 
    paddingHorizontal: scaleWidth(16), 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: scaleWidth(12), 
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12)
  },
  summaryCard: {
    flexBasis: '47%',
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: '#FFD9D9',
    minWidth: 0,
    marginBottom: scaleHeight(4),
  },
  summaryLabel: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
    marginBottom: scaleHeight(6),
    flexWrap: 'wrap',
  },
  summaryValue: {
    fontSize: scaleFont(16),
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
    flexShrink: 1,
    minWidth: 0,
  },
  tabContainer: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabScrollContent: { paddingHorizontal: scaleWidth(16) },
  tabLink: { paddingVertical: scaleHeight(14), marginRight: scaleWidth(24), position: 'relative' },
  tabLinkText: { fontSize: scaleFont(14), color: Colors.graybase, fontFamily: Fonts.GilroyMedium },
  activeTabLinkText: { color: Colors.primaryColor, fontFamily: Fonts.GilroyBold },
  activeTabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: Colors.primaryColor, borderRadius: 2 },
  mainContent: { paddingHorizontal: scaleWidth(16), marginTop: scaleHeight(20) },
  invoiceHeader: {
    marginBottom: scaleHeight(12),
  },
  invoiceBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleWidth(8),
  },
  invoiceLabel: {
    flex: 1,
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
  toolbar: { flexDirection: 'row', gap: scaleWidth(12), marginBottom: scaleHeight(20) },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: scaleWidth(8), paddingHorizontal: scaleWidth(12), height: scaleHeight(44) },
  searchInput: { flex: 1, marginLeft: scaleWidth(8), fontSize: scaleFont(14), color: Colors.darkblack, fontFamily: Fonts.GilroyRegular, padding: 0 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryColor, borderRadius: scaleWidth(8), paddingHorizontal: scaleWidth(16), height: scaleHeight(44) },
  filterBtnText: { color: Colors.white, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, marginLeft: scaleWidth(6) },
  listView: { gap: scaleHeight(16) },
  cardWrapper: { position: 'relative' },
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
  indexBadge: { backgroundColor: '#F7F8FB', width: scaleWidth(28), height: scaleWidth(28), borderRadius: scaleWidth(14), alignItems: 'center', justifyContent: 'center', marginBottom: scaleHeight(12), borderWidth: 1, borderColor: '#E6E6E6' },
  indexText: { color: Colors.graybase, fontSize: scaleFont(12), fontFamily: Fonts.GilroyBold },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(12) },
  cardHeaderContent: { flex: 1 },
  cardTitle: { fontSize: scaleFont(16), fontFamily: Fonts.GilroyBold, color: Colors.darkblack },
  cardSubtitle: { fontSize: scaleFont(13), color: Colors.graybase, marginTop: scaleHeight(4), fontFamily: Fonts.GilroyMedium },
  statusBadgeInline: { alignSelf: 'flex-start', marginTop: scaleHeight(2) },
  statusBadgeRed: {},
  statusBadgeGreen: {},
  statusBadgeText: { fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold },
  statusTextRed: { color: Colors.red },
  statusTextGreen: { color: Colors.green },
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
    fontFamily: Fonts.GilroyRegular,
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  emptyState: { alignItems: 'center', paddingVertical: scaleHeight(40) },
  emptyText: { fontSize: scaleFont(14), color: Colors.graybase, fontFamily: Fonts.GilroyMedium },
  loadingText: { marginTop: scaleHeight(12), fontSize: scaleFont(14), color: Colors.graybase, fontFamily: Fonts.GilroyMedium },
  errorText: { fontSize: scaleFont(18), color: Colors.darkblack, fontFamily: Fonts.GilroyBold, marginBottom: scaleHeight(8) },
  errorSubText: { fontSize: scaleFont(14), color: Colors.graybase, fontFamily: Fonts.GilroyMedium, textAlign: 'center', paddingHorizontal: scaleWidth(40), marginBottom: scaleHeight(24) },
  retryBtn: { backgroundColor: Colors.primaryColor, paddingHorizontal: scaleWidth(32), paddingVertical: scaleHeight(12), borderRadius: scaleWidth(8) },
  retryText: { color: Colors.white, fontSize: scaleFont(16), fontFamily: Fonts.GilroySemiBold },
});
