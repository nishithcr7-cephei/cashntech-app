import React, {useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';

const cardMetrics = [
  {label: 'Total Program Limit', value: '₹ 100,000,000.00'},
  {label: "No. of Dealer's Accounts", value: '1'},
  {label: 'Dealer Limit Uploaded', value: '₹ 20,000,000.00'},
  {label: 'Utilized Limit', value: '₹ 1,100.00'},
  {label: 'Available Limit', value: '₹ 19,998,900.00'},
  {label: 'Overdue Amount', value: '₹ 0'},
];

const dealerSummaryRows = Array.from({length: 6}).map((_, index) => ({
  id: `dealer-${index}`,
  dealer: 'Hero Finance',
  odAccount: '123101010',
  totalLimit: '₹20,000,000.00',
  drawingPower: '₹20,000,000.00',
  utilizedLimit: '₹1,100.00',
  pipelineRequests: '₹0.00',
  availableLimit: '₹19,998,900.00',
  odExpiry: 'dd-mm-yyyy',
  overdueAmount: '₹0.00',
  dpdDays: '30',
  status: 'Regular',
}));

const unpaidRows = Array.from({length: 5}).map((_, index) => ({
  id: `unpaid-${index}`,
  dealer: 'Hero Finance',
  invoiceNo: '123101010',
  invoiceAmount: '₹20,000.00',
  piAmount: '₹20,00,000.00',
  invoiceDate: 'dd-mm-yyyy',
  invoiceStatus: '-',
  financeStatus: '-',
  disbursementDate: 'dd-mm-yyyy',
  disbAmount: '₹0.00',
  utrNo: '30',
}));

export const InvoiceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dealers' | 'unpaid'>('dealers');
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  const dealerTable = useMemo(
    () => (
      <>
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchPlaceholder}>Search Entity</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.verticalList}>
          {dealerSummaryRows.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealer}</Text>
                  <Text style={styles.cardSubtitle}>
                    OD Account: {row.odAccount}
                  </Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>{row.status}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Total Limit</Text>
                  <Text style={styles.infoValue}>{row.totalLimit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Drawing Power</Text>
                  <Text style={styles.infoValue}>{row.drawingPower}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Utilized Limit</Text>
                  <Text style={styles.infoValue}>{row.utilizedLimit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Pipeline Requests</Text>
                  <Text style={styles.infoValue}>{row.pipelineRequests}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Available Limit</Text>
                  <Text style={styles.infoValue}>{row.availableLimit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>OD Expiry Date</Text>
                  <Text style={styles.infoValue}>{row.odExpiry}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Overdue Amount</Text>
                  <Text style={styles.infoValue}>{row.overdueAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>DPD Days</Text>
                  <Text style={styles.infoValue}>{row.dpdDays}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </>
    ),
    [],
  );

  const unpaidTable = useMemo(
    () => (
      <>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceBadgeContainer}>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>100</Text>
            </View>
          </View>
        </View>

        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchPlaceholder}>Search Entity</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {unpaidRows.map(row => (
            <TouchableOpacity
              key={row.id}
              style={styles.listCard}
              onPress={() => {
                navigation.navigate('InvoiceDetails', {
                  invoiceId: row.invoiceNo,
                  dealerName: row.dealer,
                });
              }}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealer}</Text>
                  <Text style={styles.cardSubtitle}>
                    Invoice / Unique Ref. No: {row.invoiceNo}
                  </Text>
                </View>
                <View style={[styles.statusChip, styles.statusWarningChip]}>
                  <Text style={[styles.statusChipText, styles.statusWarningText]}>
                    {row.invoiceStatus === '-' ? 'Unpaid' : row.invoiceStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>PI Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.piAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Date</Text>
                  <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Status</Text>
                  <Text style={styles.infoValue}>{row.invoiceStatus}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Finance Status</Text>
                  <Text style={styles.infoValue}>{row.financeStatus}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disbursement Date</Text>
                  <Text style={styles.infoValue}>{row.disbursementDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disb. Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.disbAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>UTR No.</Text>
                  <Text style={styles.infoValue}>{row.utrNo}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ),
    [navigation],
  );

  return (
    <Container>
      <AppBar title="Invoice Dashboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Invoices</Text>
        <Text style={styles.sectionSubtitle}>Invoice Details</Text>

        <View style={styles.cardGrid}>
          {cardMetrics.map(card => (
            <View key={card.label} style={styles.card}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
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
              Summary of Dealers
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
              Unpaid Invoices
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'dealers' ? dealerTable : unpaidTable}
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
    gap: scaleHeight(12),
  },
  sectionTitle: {
    fontSize: scaleFont(22),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginTop: scaleHeight(16),
  },
  sectionSubtitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(8),
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
  },
  cardLabel: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
  },
  cardValue: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
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
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    shadowColor: '#00000010',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
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
});


