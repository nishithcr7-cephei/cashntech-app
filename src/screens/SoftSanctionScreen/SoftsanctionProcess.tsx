import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  LogBox,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import React, {useEffect, useState, useCallback} from 'react';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import Fonts from '@constants/Fonts';
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
import {kycActions} from '@store/kyc';
import kycSelector from '@store/kyc/kyc.selector';
import softSelector from '@store/softsan/soft.selector';
import {getSoftSanctionBnkPro, getSoftSanctionClientList} from '@store/softsan/soft.slice';
import { decryptConditionally } from '@utils/crypto';

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
  estimatedFunding: string;
  creditPeriod: string;
};

export const SoftsanctionProcess = () => {
  const navigation = useNavigation<SoftInfoNavigationType>();
  const [search, setSearch] = useState<string>('');
  const [showLeads, setShowLeads] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedRulesetId, setSelectedRulesetId] = useState<string | null>(
    null,
  );
  const dispatch = useDispatch();
  const bankList = useSelector(kycSelector.getBankList);
  const methodList = useSelector(softSelector.getSoftSanctionBnkPro);
  const softSanctionClientList = useSelector(
    softSelector.getSoftSanctionClientList,
  );
  const softSanctionClientLoading = useSelector(
    softSelector.getSoftSanctionClientLoading,
  );
  const softSanctionClientError = useSelector(
    softSelector.getSoftSanctionClientError,
  );

  // Helper function to format numbers with Indian financial formatting
  const formatIndianNumber = (num: number | string): string => {
    if (!num || num === 'NA') return 'NA';
    
    const number = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(number)) return 'NA';
    
    // Convert to string and reverse for easier processing
    const numStr = number.toString();
    const reversed = numStr.split('').reverse();
    
    let formatted = '';
    for (let i = 0; i < reversed.length; i++) {
      if (i === 3 || i === 5 || i === 7 || i === 9) {
        formatted = ',' + formatted;
      }
      formatted = reversed[i] + formatted;
    }
    
    return formatted;
  };

  useEffect(() => {
    dispatch(kycActions.getBankList());
  }, []);

  useEffect(() => {
    if (selectedBank && selectedProduct) {
      const bank = bankList.find((b: any) => b.id.toString() === selectedBank);
      if (bank) {
        dispatch({
          type: getSoftSanctionBnkPro.type,
          payload: {bank: bank.bank_name.trim(), product: selectedProduct}
        });
      }
    }
  }, [selectedBank, selectedProduct]);

  useEffect(() => {
    if (selectedMethods.length > 0 && Array.isArray(methodList) && methodList.length > 0) {
      const selectedMethod = methodList.find(m => m.method_name === selectedMethods[0]);
      if (selectedMethod) {
        setSelectedRulesetId(selectedMethod.soft_sanction_ruleset_id);
      } else {
        setSelectedRulesetId(null);
      }
    } else {
      setSelectedRulesetId(null);
    }
  }, [selectedMethods, methodList]);

  useFocusEffect(
    useCallback(() => {
      if (showLeads) {
        dispatch(getSoftSanctionClientList());
      }
    }, [showLeads, dispatch]),
  );

  const formattedBankList = Array.isArray(bankList) ? bankList.map((bank: any) => ({
    label: bank.bank_name.trim(),
    value: bank.id.toString(),
  })) : [];

  const formattedMethodList = Array.isArray(methodList) ? methodList.map(method => ({
    label: method.method_name,
    value: method.method_name,
  })) : [];
  


  const formattedRulesetIdList = Array.isArray(methodList) ? methodList
    .filter(method => selectedMethods.includes(method.method_name))
    .map(method => ({
      label: method.soft_sanction_ruleset_id,
      value: method.soft_sanction_ruleset_id,
    })) : [];

  const clientListArray: any[] = Array.isArray(softSanctionClientList)
    ? (softSanctionClientList as any[])
    : (((softSanctionClientList as any)?.data as any[]) ?? []);
  const searchTerm = (search || '').trim().toLowerCase();
  const filteredLeads = clientListArray
    .map((lead: any) => ({
      clientId: lead.id?.toString() || 'NA',
      clientName: decryptConditionally(lead.firm_name) || 'NA',
      location: lead.city || 'NA', // city is encrypted; decrypted in card
      initiator: lead.user
        ? `${(lead.user.first_name || '').trim()} ${(
            lead.user.last_name || ''
          ).trim()}`.trim()
        : 'NA',
      turnover: formatIndianNumber(lead.monthly_turnover) || 'NA',
      estimatedFunding: formatIndianNumber(lead.estimated_funding_required) || 'NA',
      creditPeriod: lead.credit_period_offer?.toString() || 'NA',
    }))
    .sort((a: any, b: any) => {
      const idA = parseInt(a.clientId) || 0;
      const idB = parseInt(b.clientId) || 0;
      return idB - idA; // Descending: latest (higher ID) first
    })
    .filter((lead: any) => {
      if (searchTerm === '') return true;
      return (
        lead.clientName.toLowerCase().includes(searchTerm) ||
        lead.clientId.toLowerCase().includes(searchTerm)
      );
    });

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
              setSelectedMethods([]);
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
              setSelectedMethods([]);
              setSelectedRulesetId(null);
            }}
            containerStyle={{marginBottom: scaleHeight(20)}}
          />
          <View style={styles.methodsContainer}>
            <Text style={styles.methodsLabel}>Methods</Text>
            <TouchableOpacity 
              style={[
                styles.methodsDropdown,
                !selectedProduct && styles.disabledDropdown
              ]}
              onPress={() => {
                if (!selectedProduct) {
                  Toast.show({
                    type: 'error',
                    text1: 'Please select a Product first',
                  });
                  return;
                }
                // This will be handled by the dropdown logic
              }}
              disabled={!selectedProduct}
            >
              <Text style={[
                styles.methodsPlaceholder,
                selectedMethods.length > 0 && styles.selectedMethodsDisplay,
                !selectedProduct && styles.disabledText
              ]}>
                {!selectedProduct 
                  ? 'Select Product first' 
                  : selectedMethods.length > 0 
                    ? selectedMethods.join(', ') 
                    : 'Select Methods'
                }
              </Text>
            </TouchableOpacity>
            {formattedMethodList.length > 0 && selectedProduct && (
              <View style={styles.methodsList}>
                {formattedMethodList.map((method, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.methodItem}
                    onPress={() => {
                      if (selectedMethods.includes(method.value)) {
                        setSelectedMethods(selectedMethods.filter(m => m !== method.value));
                      } else {
                        setSelectedMethods([...selectedMethods, method.value]);
                      }
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedMethods.includes(method.value) && styles.checkedBox
                    ]}>
                      {selectedMethods.includes(method.value) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.methodText}>{method.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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

            if (selectedMethods.length === 0) {
              Toast.show({
                type: 'error',
                text1: 'Please select at least one Method',
              });
              return;
            }

            setShowLeads(true);
            const bank = bankList.find((b: any) => b.id.toString() === selectedBank);
            const methodParam = selectedMethods.length > 0 ? selectedMethods.join(',') : '';
            
            
            navigation.navigate('SoftSanctionRuleset', {
              bankName: bank ? bank.bank_name.trim() : '',
              product: selectedProduct ?? '',
              method: methodParam,
            } as any);
          }}
        />
        {showLeads && (
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.header}>Leads</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{filteredLeads.length}</Text>
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
                {String(softSanctionClientError)}
              </Text>
            ) : (
              <FlatList
                data={filteredLeads}
                renderItem={({item}) => (
                  <LeadCard
                    lead={item}
                    bankName={
                      bankList
                        .find((b: any) => b.id.toString() === selectedBank)
                        ?.bank_name.trim() || ''
                    }
                    productName={selectedProduct || ''}
                    methodName={
                      selectedMethods.length > 0
                        ? selectedMethods.join(',')
                        : ''
                    }
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
  methodsContainer: {
    marginBottom: scaleHeight(20),
  },
  methodsLabel: {
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkGray,
    marginBottom: scaleHeight(8),
  },
  methodsDropdown: {
    backgroundColor: Colors.LimeGray,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.SteelGray,
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  disabledDropdown: {
    backgroundColor: Colors.LimeGray,
    opacity: 0.6,
    borderColor: Colors.gray500,
  },
  methodsPlaceholder: {
    fontSize: scaleFont(14),
    color: Colors.gray500,
  },
  selectedMethodsDisplay: {
    color: Colors.black,
  },
  disabledText: {
    color: Colors.gray500,
    fontStyle: 'italic',
  },
  methodsList: {
    backgroundColor: Colors.white,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.SteelGray,
    maxHeight: 200,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.SteelGray,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkedBox: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  methodText: {
    fontSize: scaleFont(14),
    color: Colors.black,
    flex: 1,
  },
  selectedMethodsText: {
    fontSize: scaleFont(12),
    color: Colors.gray500,
    marginTop: 8,
    fontStyle: 'italic',
  },

});
