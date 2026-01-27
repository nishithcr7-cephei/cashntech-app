import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {LeftChevron} from '@assets/Icons';


// Sample data for Settlement Details
const settlementData = [
  {
    id: '1',
    date: 'dd-mm-yyyy',
    setOffAmount: '₹0.00',
    balance: '₹0.00',
  },
  {
    id: '2',
    date: 'dd-mm-yyyy',
    setOffAmount: '₹0.00',
    balance: '₹0.00',
  },
  {
    id: '3',
    date: 'dd-mm-yyyy',
    setOffAmount: '₹0.00',
    balance: '₹0.00',
  },
  {
    id: '4',
    date: 'dd-mm-yyyy',
    setOffAmount: '₹0.00',
    balance: '₹0.00',
  },
  {
    id: '5',
    date: 'dd-mm-yyyy',
    setOffAmount: '₹0.00',
    balance: '₹0.00',
  },
];

export const CreditAccountInvoiceNumber: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get data from route params or use defaults
  const creditAccountNo = (route.params as any)?.creditAccountNo || '123101010';
  const invoiceNumber = (route.params as any)?.invoiceNumber || 'Invoice Number';

  // Sample credit account details
  const accountDetails = {
    transactionDate: '10,00,000/-',
    overdueDate: '0.00/-',
    principalAmount: '0.00/-',
    balanceAmount: '7,403',
    totalPostedInterest: '0.00/-',
    interestBalance: '10,00,000/-',
    totalPenalTax: '0.00/-',
    totalOutstanding: '0.00/-',
    status: '7,403',
  };

  return (
    <Container>
      <AppBar 
        title="Invoice Dashboard" 
        navigation={navigation as any}
        showProgramSelector={true}
      />
      <View style={styles.pageTitleBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            (navigation as any).navigate('CreditAccountDetails', {
              creditAccount: creditAccountNo,
            });
          }}>
          <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
        </TouchableOpacity>
        <Text style={styles.pageTitleText}>
          Credit Account Details of Invoice Number
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Credit Account Details Summary Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Transaction Date</Text>
              <Text style={styles.detailValue}>{accountDetails.transactionDate}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Overdue Date</Text>
              <Text style={styles.detailValue}>{accountDetails.overdueDate}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Principal Amount</Text>
              <Text style={styles.detailValue}>{accountDetails.principalAmount}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Balance Amount</Text>
              <Text style={styles.detailValue}>{accountDetails.balanceAmount}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Posted Interest</Text>
              <Text style={styles.detailValue}>{accountDetails.totalPostedInterest}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Interest Balance</Text>
              <Text style={styles.detailValue}>{accountDetails.interestBalance}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Penal Tax</Text>
              <Text style={styles.detailValue}>{accountDetails.totalPenalTax}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Outstanding</Text>
              <Text style={styles.detailValue}>{accountDetails.totalOutstanding}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{accountDetails.status}</Text>
            </View>
            <TouchableOpacity
              style={styles.detailItemFull}
              activeOpacity={0.7}
              onPress={() => {
                (navigation as any).navigate('CreditAccountDailyInterest', {
                  invoiceNumber,
                  creditAccountNo,
                });
              }}>
              <Text style={[styles.detailValue, styles.clickableInterestAccrual]}>
                Daily Interest Accrual
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settlement Details Section */}
        <View style={styles.settlementSection}>
          <Text style={styles.sectionTitle}>Settlement Details</Text>
          
          {/* Settlement List - Vertical Card View */}
          <View style={styles.verticalList}>
            {settlementData.map(row => (
              <View key={row.id} style={styles.listCard}>
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>{row.date}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Set Off Amount(Rs)</Text>
                    <Text style={styles.infoValue}>{row.setOffAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Balance</Text>
                    <Text style={styles.infoValue}>{row.balance}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  detailItemFull: {
    width: '100%',
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
  settlementSection: {
    marginTop: scaleHeight(8),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
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
  clickableInterestAccrual: {
    color: Colors.tertiaryBlue,
    textDecorationLine: 'underline',
    fontFamily: Fonts.GilroySemiBold,
  },
});

