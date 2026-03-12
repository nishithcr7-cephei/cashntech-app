import React, {useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {AppBar, Container, ProgramBreadcrumb} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search} from '@assets/Icons';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {invoiceApi} from '@services/api/invoice.api';
import {formatDateDash} from './InvoiceDetails/types';

type InterestAccrualInvoiceRow = {
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
  disburseAmount: string;
  totalAccInterest: string;
  totalInterestPaid: string;
};

export const InterestAccrualsScreen: React.FC = () => {
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const programSelection = useSelector(selectProgramSelection);
  const programName = programSelection?.programName ?? 'Sun Pharma PGM';
  const isDealerMaker = userRole === 'dealer_maker';

  const [rows, setRows] = useState<InterestAccrualInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const programIds =
    programSelection?.programScope === 'all' &&
    programSelection?.allProgramIds?.length
      ? programSelection.allProgramIds
      : programSelection?.programId
      ? [programSelection.programId]
      : undefined;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const disbursed = await invoiceApi.getDisbursedList(programIds);
        const mapped: InterestAccrualInvoiceRow[] = (disbursed || []).map((item: any) => {
          const fmtMoney = (v: any) =>
            v != null
              ? `${Number(v).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}/-`
              : '-';
          const invoiceDate = formatDateDash(item.invoice_date ?? '');
          const dueDate = formatDateDash(item.invoice_due_date ?? '');
          const disburseDate = formatDateDash(item.disbursement_date ?? '');
          return {
            id: item.id,
            loanRefNo: item.loan_ref_no ?? '-',
            invoiceNo: item.invoice_ref_no ?? '-',
            bankName: item.bank_name ?? '-',
            productName: item.name ?? '-',
            programName: item.program_name ?? '-',
            primaryParty: item.partyName ?? '-',
            counterParty: item.counterPartyName ?? '-',
            invoiceAmount: fmtMoney(item.final_total),
            invoiceDate,
            dueDate,
            disburseDate,
            disburseAmount: fmtMoney(item.disbursed_amount),
            totalAccInterest: fmtMoney(item.cumulative_interest),
            totalInterestPaid: '-', // backend field not available yet
          };
        });
        setRows(mapped);
      } catch (err: any) {
        setError(err?.message || 'Failed to load interest accruals');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programIds]);

  const filteredData = !searchText.trim()
    ? rows
    : rows.filter(item => {
        const term = searchText.toLowerCase();
        return (
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.counterParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term) ||
          (item.bankName?.toLowerCase() || '').includes(term)
        );
      });

  return (
    <Container>
      <AppBar
        title="Transactions > Interest Accruals"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Program Title */}
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>{programName}</Text>
        </View>

        {/* Summary Metrics - Grid Cards (simple counters based on rows) */}
        <View style={styles.cardGrid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Dis. Invoices</Text>
            <Text style={styles.cardValue}>{rows.length}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Dis. Amount</Text>
            <Text style={styles.cardValue}>
              {rows.length
                ? `₹ ${rows
                    .reduce(
                      (sum, r) =>
                        sum +
                        (parseFloat(r.disburseAmount.replace(/[,₹/-]/g, '')) || 0),
                      0,
                    )
                    .toLocaleString('en-IN', {minimumFractionDigits: 2})}`
                : '₹ 0.00'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading interest accruals...</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Interest Accruals Section */}
            <View style={styles.invoicesHeader}>
              <Text style={styles.invoicesLabel}>Interest Accruals</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filteredData.length}</Text>
              </View>
            </View>

            {/* Search */}
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
            </View>

            {/* Interest Accruals List - Card view */}
            <View style={styles.verticalList}>
              {filteredData.map(row => (
                <View key={row.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={styles.listCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      (navigation as any).navigate('InvoiceDailyInterestScreen', {
                        invoiceId: row.id,
                        invoiceNo: row.invoiceNo,
                      })
                    }>
                    <View style={styles.infoGrid}>
                      {isDealerMaker ? (
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Counter Party</Text>
                          <Text style={styles.infoValue}>{row.counterParty}</Text>
                        </View>
                      ) : (
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Primary Party</Text>
                          <Text style={styles.infoValue}>{row.primaryParty}</Text>
                        </View>
                      )}
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Loan Ref No.</Text>
                        <Text style={styles.infoValue}>{row.loanRefNo}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Invoice No</Text>
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
                        <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
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
                        <Text style={styles.infoLabel}>Disburse Date</Text>
                        <Text style={styles.infoValue}>{row.disburseDate}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Disburse Amount (₹)</Text>
                        <Text style={styles.infoValue}>{row.disburseAmount}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Total Acc Interest (₹)</Text>
                        <Text style={styles.infoValue}>{row.totalAccInterest}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Total Interest Paid Amount (₹)</Text>
                        <Text style={styles.infoValue}>{row.totalInterestPaid}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  loadingContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  errorText: {
    fontSize: scaleFont(14),
    color: Colors.red,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
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
  exportButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
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
});
