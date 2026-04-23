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
import {Search, LeftChevron} from '@assets/Icons';

// Sample data for Daily Interest
const dailyInterestData = [
  {
    id: '1',
    date: 'dd-mm-yyyy',
    invoiceRefNo: '123101010',
    balanceAmount: '₹20,000',
    interestRate: '0.00%',
    interestAmount: '₹20,000',
    penalRate: '0.00%',
    penalValues: '₹300/-',
    penalAmount: '₹20,300/-',
    cumulativeInterest: '-',
  },
  {
    id: '2',
    date: 'dd-mm-yyyy',
    invoiceRefNo: '123101010',
    balanceAmount: '₹20,000',
    interestRate: '0.00%',
    interestAmount: '₹20,000',
    penalRate: '0.00%',
    penalValues: '₹300/-',
    penalAmount: '₹20,300/-',
    cumulativeInterest: '-',
  },
  {
    id: '3',
    date: 'dd-mm-yyyy',
    invoiceRefNo: '123101010',
    balanceAmount: '₹20,000',
    interestRate: '0.00%',
    interestAmount: '₹20,000',
    penalRate: '0.00%',
    penalValues: '₹300/-',
    penalAmount: '₹20,300/-',
    cumulativeInterest: '-',
  },
  {
    id: '4',
    date: 'dd-mm-yyyy',
    invoiceRefNo: '123101010',
    balanceAmount: '₹20,000',
    interestRate: '0.00%',
    interestAmount: '₹20,000',
    penalRate: '0.00%',
    penalValues: '₹300/-',
    penalAmount: '₹20,300/-',
    cumulativeInterest: '-',
  },
  {
    id: '5',
    date: 'dd-mm-yyyy',
    invoiceRefNo: '123101010',
    balanceAmount: '₹20,000',
    interestRate: '0.00%',
    interestAmount: '₹20,000',
    penalRate: '0.00%',
    penalValues: '₹300/-',
    penalAmount: '₹20,300/-',
    cumulativeInterest: '-',
  },
];

export const CreditAccountDailyInterest: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchText, setSearchText] = useState('');

  // Get data from route params or use defaults
  const invoiceNumber = (route.params as any)?.invoiceNumber || '123456';
  const creditAccountNo = (route.params as any)?.creditAccountNo || '123101010';

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return dailyInterestData;
    const term = searchText.toLowerCase();
    return dailyInterestData.filter(
      item =>
        item.invoiceRefNo.toLowerCase().includes(term) ||
        item.date.toLowerCase().includes(term),
    );
  }, [searchText]);

  return (
    <Container>
      <AppBar title="Invoice Dashboard" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            (navigation as any).navigate('CreditAccountInvoiceNumber', {
              creditAccountNo,
              invoiceNumber,
            });
          }}>
          <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
        </TouchableOpacity>
        <Text style={styles.pageTitleText}>
          Credit Account Daily Interest
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Search Toolbar */}
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

        {/* Daily Interest List - Vertical Card View */}
        <View style={styles.verticalList}>
          {filteredData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{row.date}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice / Unique Ref. No</Text>
                  <Text style={styles.infoValue}>{row.invoiceRefNo}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Balance Amount</Text>
                  <Text style={styles.infoValue}>{row.balanceAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Interest Rate (%)</Text>
                  <Text style={styles.infoValue}>{row.interestRate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Interest Amount</Text>
                  <Text style={styles.infoValue}>{row.interestAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Penal Rate (%)</Text>
                  <Text style={styles.infoValue}>{row.penalRate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Penal Values</Text>
                  <Text style={styles.infoValue}>{row.penalValues}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Penal Amount</Text>
                  <Text style={styles.infoValue}>{row.penalAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Cumulative Interest</Text>
                  <Text style={styles.infoValue}>{row.cumulativeInterest}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  pageTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  backButton: {
    marginRight: scaleWidth(12),
    padding: scaleWidth(4),
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

