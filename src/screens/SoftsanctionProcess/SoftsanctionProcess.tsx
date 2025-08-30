import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  LogBox,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import React, {useEffect, useState, useCallback} from 'react';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  Container,
  AppBar,
  CustomDropdown,
  Button,
  LeadCard,
} from '@components/index';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {ScrollView} from 'react-native-gesture-handler';
import {Search} from '@assets/Icons';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/app/store';
import {clientActions} from '@store/client';
import clientSelector from '@store/client/client.selector';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type Lead = {
  clientId: string;
  clientName: string;
  location: string;
  initiator: string;
  turnover: string;
  creditPeriod: string;
};

export const SoftsanctionProcess = () => {
  const navigation = useNavigation<SoftInfoNavigationType>();
  const [search, setSearch] = useState<string>('');
  const [showLeads, setShowLeads] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedRulesetId, setSelectedRulesetId] = useState<string | null>(
    null,
  );
  const dispatch = useDispatch();
  const bankList = useSelector((state: RootState) => state.client.BankList);
  const methodList = useSelector(
    (state: RootState) => state.client.SoftSanctionBNKPROData,
  );
  const softSanctionClientList = useSelector(
    clientSelector.getSoftSanctionClientList,
  );
  const softSanctionClientLoading = useSelector(
    clientSelector.getSoftSanctionClientLoading,
  );
  const softSanctionClientError = useSelector(
    clientSelector.getSoftSanctionClientError,
  );

  useEffect(() => {
    dispatch(clientActions.getBankList());
  }, []);

  useEffect(() => {
    if (selectedBank && selectedProduct) {
      const bank = bankList.find(b => b.id.toString() === selectedBank);
      if (bank) {
        dispatch({
          type: clientActions.getSoftSanctionBnkPro.type,
          payload: {bank: bank.bank_name.trim(), product: selectedProduct},
        });
      }
    }
  }, [selectedBank, selectedProduct]);

  useEffect(() => {
    if (selectedMethod && methodList.length > 0) {
      const method = methodList.find(m => m.method_name === selectedMethod);
      if (method) {
        setSelectedRulesetId(method.soft_sanction_ruleset_id);
      } else {
        setSelectedRulesetId(null);
      }
    } else {
      setSelectedRulesetId(null);
    }
  }, [selectedMethod, methodList]);

  useFocusEffect(
    useCallback(() => {
      if (showLeads) {
        dispatch(clientActions.getSoftSanctionClientList());
      }
    }, [showLeads, dispatch]),
  );

  const formattedBankList = bankList.map(bank => ({
    label: bank.bank_name.trim(),
    value: bank.id.toString(),
  }));

  const formattedMethodList = methodList.map(method => ({
    label: method.method_name,
    value: method.method_name,
  }));

  const formattedRulesetIdList = methodList
    .filter(method => method.method_name === selectedMethod)
    .map(method => ({
      label: method.soft_sanction_ruleset_id,
      value: method.soft_sanction_ruleset_id,
    }));

  const filteredLeads = softSanctionClientList
    .map(lead => ({
      clientId: lead.id?.toString() || 'NA',
      clientName: lead.client_name || 'NA',
      location: lead.location || 'NA',
      initiator: lead.user
        ? `${(lead.user.first_name || '').trim()} ${(
            lead.user.last_name || ''
          ).trim()}`.trim()
        : 'NA',
      turnover: lead.monthly_turnover || 'NA',
      creditPeriod: lead.credit_period_offer?.toString() || 'NA',
    }))
    .sort((a, b) => {
      const idA = parseInt(a.clientId) || 0;
      const idB = parseInt(b.clientId) || 0;
      return idA - idB;
    })
    .filter(lead =>
      lead.clientName.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <Container>
      <AppBar title="Soft Sanction" navigation={navigation} />

      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Soft Sanction Process</Text>
      </View>
      <ScrollView>
        <View style={styles.head}>
          <Text style={styles.headText}>Ruleset ID Details</Text>
        </View>
        <View style={styles.inputContainer}>
          <CustomDropdown
            label="Bank Name"
            data={formattedBankList}
            placeholder="Bank Name"
            value={selectedBank ?? undefined}
            onChange={val => {
              setSelectedBank(val);
              setSelectedMethod(null);
              setSelectedRulesetId(null);
            }}
            containerStyle={{marginBottom: scaleHeight(20)}}
          />
          <CustomDropdown
            label="Product"
            data={[
              {label: 'PID', value: 'PID'},
              {label: 'VF', value: 'VF'},
              {label: 'DF', value: 'DF'},
            ]}
            placeholder="Product Name"
            value={selectedProduct ?? undefined}
            onChange={val => {
              setSelectedProduct(val);
              setSelectedMethod(null);
              setSelectedRulesetId(null);
            }}
            containerStyle={{marginBottom: scaleHeight(20)}}
          />
          <Text style={styles.label}>Method</Text>
          <TextInput
            value={
              selectedBank && selectedProduct && methodList.length > 0
                ? methodList.map(m => m.method_name).join(', ')
                : ''
            }
            editable={false}
            style={styles.input}
            placeholder="Method Names"
            placeholderTextColor={Colors.balancedGray}
          />

          <Text style={styles.label}>Rulest ID</Text>
          <TextInput
            value={
              selectedBank && selectedProduct && methodList.length > 0
                ? methodList.map(m => m.soft_sanction_ruleset_id).join(', ')
                : ''
            }
            editable={false}
            style={styles.input}
            placeholder="Ruleset IDs"
            placeholderTextColor={Colors.balancedGray}
          />
        </View>
        <Button
          buttonText={'View Rulset'}
          style={styles.button}
          onPress={() => {
            // Validation: Check if Bank Name and Product are selected
            if (!selectedBank) {
              Toast.show({
                type: 'error',
                text1: 'Please select Bank Name',
              });
              return;
            }
            
            if (!selectedProduct) {
              Toast.show({
                type: 'error',
                text1: 'Please select Product',
              });
              return;
            }

            setShowLeads(true);
            const bank = bankList.find(b => b.id.toString() === selectedBank);
            navigation.navigate('SoftSanctionRuleset', {
              bankName: bank ? bank.bank_name.trim() : '',
              product: selectedProduct ?? '',
            } as any);
          }}
        />
        {showLeads && (
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.header}>Leads</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {softSanctionClientList.length}
                  </Text>
                </View>
              </View>
              <View style={styles.searchContainer}>
                <Search width={16} height={16} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Leads"
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor={Colors.darkGray}
                />
              </View>
            </View>

            {softSanctionClientLoading ? (
              <View style={{paddingVertical: 20}}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
              </View>
            ) : softSanctionClientError ? (
              <Text style={{textAlign: 'center', color: 'red', marginTop: 20}}>
                {softSanctionClientError}
              </Text>
            ) : (
              <FlatList
                data={filteredLeads}
                renderItem={({item}) => (
                  <LeadCard
                    lead={item}
                    bankName={
                      bankList
                        .find(b => b.id.toString() === selectedBank)
                        ?.bank_name.trim() || ''
                    }
                    productName={selectedProduct || ''}
                    methodName={selectedMethod || ''}
                    rulesetId={selectedRulesetId || ''}
                  />
                )}
                keyExtractor={item => item.clientId}
                ListEmptyComponent={
                  <Text style={{textAlign: 'center', marginTop: 20}}>
                    No Clients Found
                  </Text>
                }
              />
            )}
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  Subcontainer: {
    backgroundColor: Colors.white,
  },
  label: {
    marginBottom: scaleHeight(8),
    color: Colors.darkGray,
    fontWeight: fontWeight.Bold,
  },
  input: {
    marginBottom: scaleHeight(20),
    borderWidth: 1,
    borderColor: Colors.SteelGray,
    borderRadius: 6,
    padding: 10,
    backgroundColor: Colors.LimeGray,
    color: Colors.black,
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  head: {
    padding: scaleHeight(16),
    marginTop: scaleHeight(10),
  },
  headText: {
    fontSize: scaleFont(16),
    color: Colors.graybase,
    fontWeight: fontWeight.SemiBold,
  },
  inputContainer: {
    margin: scaleHeight(16),
    marginTop: scaleHeight(10),
  },
  button: {
    marginTop: scaleHeight(5),
    marginBottom: scaleHeight(16),
    marginLeft: scaleWidth(189),
    marginRight: scaleWidth(35),
    alignSelf: 'flex-end',
    paddingVertical: scaleHeight(8),
    borderRadius: 4,
  },
  container: {
    padding: 16,
    backgroundColor: '#fafafa',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: fontWeight.Bold,
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#fdeef1',
    borderRadius: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  countText: {
    color: Colors.SteelGray,
    fontWeight: fontWeight.Bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    height: 40,
    marginLeft: 10,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    padding: 10,
    color: '#000',
  },
});
