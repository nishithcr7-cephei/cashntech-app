import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AppBar, Container, ProgramBreadcrumb} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search} from '@assets/Icons';

// Sample data for Credit Account Summary
const summaryData = [
  {
    id: '1',
    date: 'dd-mm-yyyy',
    amount: '₹20,000',
    debit: '₹1,100.00',
    credit: '₹0.00',
    particulars: '-',
    balance: '₹0.00',
    interestBalance: '₹0.00',
    penalBalance: '₹0.00',
    advancedInterest: '₹0.00',
  },
];

// Sample data for Total Outstanding
const paymentsData = [
  {
    id: '1',
    particulars: '-',
    drawdownDate: 'dd-mm-yyyy',
    overdueDate: 'dd-mm-yyyy',
    principalBalance: '₹0.00',
    feesChargesBalance: '₹0.00',
    accruedInterestBalance: '₹0.00',
    accruedPenalBalance: '₹0.00',
    totalPenalTax: '₹0.00',
    totalOutstanding: '₹0.00',
    status: 'Closed',
  },
];

export const CreditAccountDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<'summary' | 'outstanding'>('summary');
  const [searchText, setSearchText] = useState('');

  // Get data from route params or use defaults
  const dealerName = (route.params as any)?.dealerName || 'Hero Finance';
  const creditAccountNo = (route.params as any)?.creditAccount || '12345666';
  const anchor = (route.params as any)?.anchor || 'Sun Pharma';

  // Sample credit account details
  const accountDetails = {
    creditAccountNo: creditAccountNo,
    anchor: anchor,
    status: 'Approved',
    limitExpiryDate: 'dd-mm-yyyy',
    sanctionedLimit: '10,00,000/-',
    drawingPower: '10,00,000/-',
    utilizedLimit: '0.00/-',
    pipelineRequests: '0.00/-',
    excessCredit: '7,403',
    totalPenalTax: '0.00/-',
    availableLimit: '10,00,000/-',
    totalOutstanding: '0.00/-',
    overdueDays: 0,
  };

  const filteredSummaryData = useMemo(() => {
    if (!searchText.trim()) return summaryData;
    const term = searchText.toLowerCase();
    return summaryData.filter(
      item =>
        item.particulars.toLowerCase().includes(term) ||
        item.date.toLowerCase().includes(term),
    );
  }, [searchText]);

  const filteredPaymentsData = useMemo(() => {
    if (!searchText.trim()) return paymentsData;
    const term = searchText.toLowerCase();
    return paymentsData.filter(
      item =>
        item.particulars.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term),
    );
  }, [searchText]);

  const renderTabContent = () => {
    if (activeTab === 'summary') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.dealerNameText}>
              Dealer Name - {dealerName}
            </Text>
          </View>

          <View style={styles.listToolbar}>
            <View style={styles.searchBox}>
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

          {/* Summary List - Vertical Card View */}
          <View style={styles.verticalList}>
            {filteredSummaryData.map(row => (
              <View key={row.id} style={styles.listCard}>
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>{row.date}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Amount</Text>
                    <Text style={styles.infoValue}>{row.amount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Debit</Text>
                    <Text style={styles.infoValue}>{row.debit}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Credit</Text>
                    <Text style={styles.infoValue}>{row.credit}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Particulars</Text>
                    <Text style={styles.infoValue}>{row.particulars}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Balance</Text>
                    <Text style={styles.infoValue}>{row.balance}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Interest Balance</Text>
                    <Text style={styles.infoValue}>{row.interestBalance}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Penal Balance</Text>
                    <Text style={styles.infoValue}>{row.penalBalance}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Advanced Interest</Text>
                    <Text style={styles.infoValue}>{row.advancedInterest}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payments</Text>
            <Text style={styles.dealerNameText}>
              Dealer Name - {dealerName}
            </Text>
          </View>

          <View style={styles.listToolbar}>
            <View style={styles.searchBox}>
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

          {/* Payments List - Vertical Card View */}
          <View style={styles.verticalList}>
            {filteredPaymentsData.map(row => (
              <View key={row.id} style={styles.listCard}>
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Particulars</Text>
                    <Text style={styles.infoValue}>{row.particulars}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Drawdown Date</Text>
                    <Text style={styles.infoValue}>{row.drawdownDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Overdue Date</Text>
                    <Text style={styles.infoValue}>{row.overdueDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Principal Balance</Text>
                    <Text style={styles.infoValue}>{row.principalBalance}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Fees / Charges Balance</Text>
                    <Text style={styles.infoValue}>{row.feesChargesBalance}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Accrued Interest Balance</Text>
                    <Text style={styles.infoValue}>{row.accruedInterestBalance}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Accrued Penal Balance</Text>
                    <Text style={styles.infoValue}>{row.accruedPenalBalance}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Total Penal Tax</Text>
                    <Text style={styles.infoValue}>{row.totalPenalTax}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Total Outstanding</Text>
                    <Text style={styles.infoValue}>{row.totalOutstanding}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, styles.statusValue]}>
                      {row.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }
  };

  return (
    <Container>
      <AppBar title="Payments" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>
          Credit Account Details of {dealerName}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Credit Account Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsGrid}>
            <TouchableOpacity
              style={styles.detailItem}
              activeOpacity={0.7}
              onPress={() => {
                (navigation as any).navigate('CreditAccountInvoiceNumber', {
                  creditAccountNo: accountDetails.creditAccountNo,
                });
              }}>
              <Text style={styles.detailLabel}>Credit Account No.:</Text>
              <Text style={[styles.detailValue, styles.clickableAccountNo]}>
                {accountDetails.creditAccountNo}
              </Text>
            </TouchableOpacity>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Anchor:</Text>
              <Text style={styles.detailValue}>{accountDetails.anchor}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.statusValue]}>
                {accountDetails.status}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Limit Expiry Date:</Text>
              <Text style={styles.detailValue}>{accountDetails.limitExpiryDate}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Sanctioned Limit:</Text>
              <Text style={styles.detailValue}>{accountDetails.sanctionedLimit}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Drawing Power:</Text>
              <Text style={styles.detailValue}>{accountDetails.drawingPower}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Utilized Limit:</Text>
              <Text style={styles.detailValue}>{accountDetails.utilizedLimit}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pipeline Requests:</Text>
              <Text style={styles.detailValue}>{accountDetails.pipelineRequests}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Excess Credit:</Text>
              <Text style={styles.detailValue}>{accountDetails.excessCredit}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Penal Tax:</Text>
              <Text style={styles.detailValue}>{accountDetails.totalPenalTax}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Available Limit:</Text>
              <Text style={styles.detailValue}>{accountDetails.availableLimit}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Outstanding:</Text>
              <Text style={styles.detailValue}>{accountDetails.totalOutstanding}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Overdue Days:</Text>
              <Text style={styles.detailValue}>{accountDetails.overdueDays}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('summary')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'summary' && styles.activeTabText,
              ]}>
              Credit Account Summary
            </Text>
            {activeTab === 'summary' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('outstanding')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'outstanding' && styles.activeTabText,
              ]}>
              Total Outstanding
            </Text>
            {activeTab === 'outstanding' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
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
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(24),
  },
  detailsSection: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  detailItem: {
    width: '47%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(12),
  },
  detailLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  detailValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  statusValue: {
    color: '#4CAF50',
    fontFamily: Fonts.GilroySemiBold,
  },
  clickableAccountNo: {
    color: Colors.tertiaryBlue,
    textDecorationLine: 'underline',
    fontFamily: Fonts.GilroySemiBold,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: scaleHeight(16),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    position: 'relative',
  },
  tabText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  activeTabText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primaryColor,
  },
  tabContent: {
    marginTop: scaleHeight(8),
  },
  sectionHeader: {
    marginBottom: scaleHeight(12),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  dealerNameText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    backgroundColor: Colors.white,
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
    marginBottom: scaleHeight(12),
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

