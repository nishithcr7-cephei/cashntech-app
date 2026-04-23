import React, {useEffect, useState, useMemo} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Container, AppBar, ProgramBreadcrumb} from '@components/index';
import {Search, LeftChevron} from '@assets/Icons';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {interestAccrualActions, interestAccrualSelectors} from '@store/interestAccrual';
import {formatDateDash} from '../InvoiceList/components/InvoiceDetails/types';



export const InvoiceDailyInterestScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeNavigatorType>>();
  const route = useRoute<any>();

  const invoiceId: string = route.params?.invoiceId;
  const invoiceNo: string = route.params?.invoiceNo ?? '-';

  const dispatch = useDispatch();
  const dailyInterestData = useSelector(interestAccrualSelectors.selectDailyInterestList);
  const loading = useSelector(interestAccrualSelectors.selectInterestAccrualLoading);
  const apiError = useSelector(interestAccrualSelectors.selectInterestAccrualError);
  
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setError('Missing invoice id');
      return;
    }
    dispatch(interestAccrualActions.fetchDailyInterestRequest({invoiceId}));
  }, [invoiceId, dispatch]);

  const rows = useMemo(() => {
    return (dailyInterestData || []).map((item: any, index: number) => {
      const fmt = (v: number | string) =>
        Number(v || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      const penalAmount =
        (item.penal_interest_on_interest || 0) +
        (item.penal_interest_on_principal || 0);
      return {
        id: String(item.id ?? index + 1),
        srNo: index + 1,
        invoiceNo,
        balanceAmount: '-',
        interestRate: fmt(item.interest_rate),
        interestAmount: `₹ ${fmt(item.daily_interest)}`,
        date: formatDateDash(item.accrual_date),
        penalRate: penalAmount ? '-' : '-',
        penalValues: penalAmount ? '-' : '-',
        penalAmount: penalAmount ? `₹ ${fmt(penalAmount)}` : '-',
        cumulativeInterest: `₹ ${fmt(item.cumulative_interest)}`,
        outstandingPrincipal: `₹ ${fmt(item.outstanding_principal ?? item.outstanding_principal_date)}`,
      };
    });
  }, [dailyInterestData, invoiceNo]);

  const filteredRows = !searchText.trim()
    ? rows
    : rows.filter(row => {
        const term = searchText.toLowerCase();
        return (
          row.invoiceNo.toLowerCase().includes(term) ||
          row.date.toLowerCase().includes(term)
        );
      });

  return (
    <Container>
      <AppBar title="Daily Interest" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation as any).navigate('InterestAccrualsScreen')}>
          <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
        </TouchableOpacity>
        <Text style={styles.pageTitleText}>Daily Interest - {invoiceNo}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Search width={scaleWidth(18)} height={scaleHeight(18)} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Invoice / Date"
              placeholderTextColor={Colors.graybase}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>Loading daily interest...</Text>
          </View>
        ) : (error || apiError) ? (
          <View style={styles.infoRow}>
            <Text style={[styles.infoValue, {color: Colors.red}]}>{error || apiError}</Text>
          </View>
        ) : (
          <View style={styles.verticalList}>
            {filteredRows.map(row => (
              <View key={row.id} style={styles.listCard}>
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Sr. No</Text>
                    <Text style={styles.infoValue}>{row.srNo}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>{row.date}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice No.</Text>
                    <Text style={styles.infoValue}>{row.invoiceNo}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Balance Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.balanceAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Outstanding Principal (₹)</Text>
                    <Text style={styles.infoValue}>{row.outstandingPrincipal}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Interest Rate (%)</Text>
                    <Text style={styles.infoValue}>{row.interestRate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Interest Amount (₹)</Text>
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
                    <Text style={styles.infoLabel}>Penal Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.penalAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Cumulative Interest (₹)</Text>
                    <Text style={styles.infoValue}>
                      {row.cumulativeInterest}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
  infoRow: {
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
  },
});
