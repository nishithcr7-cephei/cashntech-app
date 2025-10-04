import {Input} from '@components/Input/Input';
import fontWeight from '@constants/FontWeight';
import {Colors} from '@constants/index';
import {scaleFont, scaleHeight} from '@utils/Scale';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions} from '@store/client';
import softSelector from '@store/softsan/soft.selector';
import {getSoftSanctionFields, clearSoftSanctionFields, runSoftSanction, clearSoftSanctionResult} from '@store/softsan/soft.slice';
import clientApi from '@services/api/client.api';
import {Config} from '@config/index';
import Endpoints from '@constants/ApiEndPoints';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {decryptUtility} from '@utils/crypto';
import StorageKeys from '@constants/StorageKeys';
import {getStorage} from '@services/localStorage';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type LeadProps = {
  lead: {
    clientId: string;
    clientName: string;
    location: string;
    initiator: string;
    turnover: string;
    estimatedFunding: string;
    creditPeriod: string;
    sector: string;
  };
  bankName: string;
  productName: string;
  methodName: string;
  rulesetId: string;
  index: number;
};

export const LeadCard: React.FC<LeadProps> = ({
  lead,
  bankName,
  productName,
  methodName,
  rulesetId,
  index,
}) => {
  const [showModal, setShowModal] = useState(false);
  // 1. Clean up initial state to use only IDs
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const dispatch = useDispatch();
  const navigation = useNavigation<SoftInfoNavigationType>();
  const fields = useSelector(softSelector.getSoftSanctionFields) || {};
  const loading = useSelector(softSelector.getSoftSanctionFieldsLoading);
  const error = useSelector(softSelector.getSoftSanctionFieldsError);
  
  // New selectors for dynamic API result
  const softSanctionResult = useSelector(softSelector.getSoftSanctionResult);
  const softSanctionResultLoading = useSelector(softSelector.getSoftSanctionResultLoading);
  const softSanctionResultError = useSelector(softSelector.getSoftSanctionResultError);

  // Handle the result from Redux
  useEffect(() => {
    if (softSanctionResult && showModal) {
      // Only navigate if the modal is currently shown (i.e., this component is active)
      
      // Navigate based on result
      if (softSanctionResult.statusCode === 500 || softSanctionResult?.error || softSanctionResult?.message) {
        setShowModal(false);
        dispatch(clearSoftSanctionFields());
        navigation.navigate('RulesetView', {
          rulesetData: [],
          location: lead.location ? decryptUtility(lead.location) : '',
          clientName: lead.clientName || '',
          clientId: lead.clientId,
          errorMessage: softSanctionResult?.message || softSanctionResult?.error || 'API Error occurred',
        } as any);
      } else {
        setShowModal(false);
        dispatch(clearSoftSanctionFields());
        navigation.navigate('RulesetView', {
          rulesetData: softSanctionResult?.data || [],
          location: lead.location ? decryptUtility(lead.location) : '',
          clientName: lead.clientName || '',
          clientId: lead.clientId,
        } as any);
      }
      
      // Clear the result after handling
      dispatch(clearSoftSanctionResult());
    }
  }, [softSanctionResult, dispatch, navigation, lead, setShowModal, showModal]);

  // Handle errors from Redux
  useEffect(() => {
    if (softSanctionResultError && showModal) {
      // Only navigate if the modal is currently shown (i.e., this component is active)
      setShowModal(false);
      dispatch(clearSoftSanctionFields());
      navigation.navigate('RulesetView', {
        rulesetData: [],
        location: lead.location ? decryptUtility(lead.location) : '',
        clientName: lead.clientName || '',
        clientId: lead.clientId,
        errorMessage: softSanctionResultError,
      } as any);
      dispatch(clearSoftSanctionResult());
    }
  }, [softSanctionResultError, dispatch, navigation, lead, setShowModal, showModal]);

  const handleOpenModal = () => {
    setShowModal(true);
    // Debug log to see what methodName is being passed
    
    // Build the full URL to show in alert
    let fullUrl = `/client-info-master/soft-sanction/inputs?bank=${encodeURIComponent(bankName)}&product=${encodeURIComponent(productName)}`;
    if (methodName) {
      const methods = methodName.split(',');
      methods.forEach(m => {
        fullUrl += `&methods=${encodeURIComponent(m.trim())}`;
      });
    }
    
    // Show alert with full URL
    
    // Use the methodName passed from SoftsanctionProcess.tsx (already comma-separated)
    dispatch(getSoftSanctionFields({bankName, productName, methodName}));
  };

  const handleInputChange = (id: string, value: string) => {
    
    // Find the field to check if it's a dependency/percentage field
    let isPercentageField = false;
    let fieldLabel = '';
    Object.keys(fields).forEach(method => {
      (fields as Record<string, any[]>)[method].forEach((field: any) => {
        if (field.id === id) {
          fieldLabel = field.label || '';
          const label = fieldLabel.toLowerCase();
          isPercentageField = label.includes('dependency') || label.includes('dependancy') || label.includes('percentage') || label.includes('%');
        }
      });
    });
    
    if (isPercentageField) {
      // For dependency/percentage fields: ONLY allow numbers and ONE decimal point
      // Examples: "98", "98.22", "100.5" - NO commas, NO other formatting
      const cleanValue = value.replace(/[^\d.]/g, '');
      
      // Ensure only one decimal point
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        return; // Don't update if more than one decimal point
      }
      
      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        return; // Don't update if more than 2 decimal places
      }
      
      setInputValues(prev => {
        const newValues = { ...prev, [id]: cleanValue };
        return newValues;
      });
    } else {
      // For regular numeric fields, use Indian financial formatting
      const numericValue = value.replace(/[^\d,]/g, '');
      const cleanValue = numericValue.replace(/,/g, '');
      const formattedValue = formatIndianNumber(cleanValue);
      
      setInputValues(prev => {
        const newValues = { ...prev, [id]: formattedValue };
        return newValues;
      });
    }
  };

  // Helper function to format numbers with Indian financial formatting
  const formatIndianNumber = (num: string): string => {
    if (!num) return '';
    
    const number = parseInt(num, 10);
    if (isNaN(number)) return '';
    
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

  const handleRun = async () => {
    // Validation: Check if any required fields are empty
    const emptyFields: string[] = [];
    
    Object.keys(fields).forEach(method => {
      (fields as Record<string, any[]>)[method].forEach((field: any) => {
        const value = inputValues[field.id];
        if (!value || value.trim() === '' || value === '0') {
          emptyFields.push(field.label);
        }
      });
    });
    
    if (emptyFields.length > 0) {
      Alert.alert(
        'Validation Error',
        `Please fill in the following fields:\n\n${emptyFields.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Additional validation rules between methods (apply only when both methods are present and Turnover value is entered)
    try {
      const methodKeys = Object.keys(fields || {});
      const findMethodKey = (name: string) =>
        methodKeys.find(k => k?.toLowerCase() === name.toLowerCase());

      const turnoverKey = findMethodKey('Turnover');
      const purchaseKey = findMethodKey('Purchase');

      // Only enforce if both TURNOVER and PURCHASE sections exist
      if (turnoverKey && purchaseKey) {
        const turnoverFields = (fields as Record<string, any[]>)[turnoverKey] || [];
        const turnoverCPField = turnoverFields.find(
          f => (f?.label || '').trim().toLowerCase() === 'credit period offered'
        );
        const turnoverCreditPeriodValue = turnoverCPField
          ? (inputValues[turnoverCPField.id] || '').replace(/,/g, '').trim()
          : '';

        // If user didn't enter Turnover CREDIT PERIOD, skip cross-checks
        if (turnoverCreditPeriodValue) {
          const purchaseFields = (fields as Record<string, any[]>)[purchaseKey] || [];
          const purchaseWcField = purchaseFields.find(
            f => (f?.label || '').trim().toLowerCase() === 'existing w/c limits'
          );
          const purchaseCpField = purchaseFields.find(
            f => (f?.label || '').trim().toLowerCase() === 'credit period offered'
          );

          const purchaseWcVal = purchaseWcField
            ? (inputValues[purchaseWcField.id] || '').replace(/,/g, '').trim()
            : '';
          const purchaseCpVal = purchaseCpField
            ? (inputValues[purchaseCpField.id] || '').replace(/,/g, '').trim()
            : '';

          if (purchaseWcVal && purchaseWcVal !== turnoverCreditPeriodValue) {
            Alert.alert(
              'Validation Error',
              'In PURCHASE Method, Existing W/C Limits must be the same as TURNOVER Method CREDIT PERIOD Offered value',
              [{ text: 'OK' }]
            );
            return;
          }

          if (purchaseCpVal && purchaseCpVal !== turnoverCreditPeriodValue) {
            Alert.alert(
              'Validation Error',
              'In PURCHASE Method, CREDIT PERIOD Offered must be the same as TURNOVER Method CREDIT PERIOD Offered value',
              [{ text: 'OK' }]
            );
            return;
          }
        }
      }
    } catch (e) {
    }

    


    // Build POST body dynamically using EXACT modal labels as keys
    const payload: Record<string, any> = { bank_name: bankName };
    const displayBody: Record<string, string> = {};

    Object.keys(fields).forEach(method => {
      (fields as Record<string, any[]>)[method].forEach((field: any) => {
        const rawValue = inputValues[field.id] ?? '';
        displayBody[field.label] = rawValue;
        
        // Check if this is a percentage field
        const isPercentageField = field.label.toLowerCase().includes('dependency') || 
                                 field.label.toLowerCase().includes('dependancy') || 
                                 field.label.toLowerCase().includes('percentage') || 
                                 field.label.toLowerCase().includes('%');
        
        let cleanedValue;
        if (isPercentageField) {
          // For percentage fields, just remove any non-numeric characters except decimal point
          cleanedValue = rawValue.toString().replace(/[^\d.]/g, '').trim();
        } else {
          // For regular fields, remove commas (Indian formatting)
          cleanedValue = rawValue.toString().replace(/,/g, '').trim();
        }
        
        // Use the label as the POST body key
        payload[field.label] = cleanedValue === '' ? 0 : Number(cleanedValue);
        
        // Also alias known variant to expected key if needed
        if (field.label === 'Limit from banks') {
          payload['Existing W/C Limits'] = payload[field.label];
        }
      });
    });


    // Validate: if any field value is missing, show alert with that label and stop
    const missingLabels: string[] = [];
    Object.keys(fields).forEach(method => {
      (fields as Record<string, any[]>)[method].forEach((field: any) => {
        const val = (displayBody[field.label] || '').toString().trim();
        if (val === '' || val === '0') {
          missingLabels.push(field.label);
        }
      });
    });

    if (missingLabels.length > 0) {
      Alert.alert(
        'Please enter values',
        missingLabels.map(l => `- ${l}`).join('\n')
      );
      return;
    }


    // Construct the dynamic URL with actual values
    const dynamicApiUrl = `${Config.API_URL}/client-info-master/soft-sanction/calculate/${lead.clientId}?bank=${encodeURIComponent(bankName)}&product=${encodeURIComponent(productName)}&methods=${encodeURIComponent(methodName)}`;

    
    const getFieldIdByLabel = (label: string): string | undefined => {
      let foundId: string | undefined;
      Object.keys(fields || {}).forEach(method => {
        (fields as Record<string, any[]>)[method].forEach((field: any) => {
          if (!foundId && field?.label === label) {
            foundId = field.id;
          }
        });
      });
      return foundId;
    };

    const existingWcId = getFieldIdByLabel('Limit from banks') || getFieldIdByLabel('Existing W/C Limits');
    const stockId = getFieldIdByLabel('Stock');

    

    // Use Redux action instead of direct fetch
    dispatch(runSoftSanction({
      url: dynamicApiUrl,
      payload
    }));
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.text}>
          <Text style={styles.label}>ID :</Text> {lead.clientId}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Sr.No :</Text> {index + 1}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Firm Name :</Text> {lead.clientName}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Sector :</Text> {lead.sector}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>City :</Text>{' '}
          {lead.location ? decryptUtility(lead.location) : ''}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Estimated Funding Required :</Text> {lead.estimatedFunding}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Initiator :</Text> {lead.initiator}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Annual Turnover :</Text> {lead.turnover}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Credit Period (In Days) :</Text> {lead.creditPeriod}
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleOpenModal}>
          <Text style={styles.buttonText}>Run Soft Sanction</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Run Soft Sanction</Text>
            <Text style={styles.modalSubtitle}>
              {loading
                ? 'Loading fields...'
                : error
                ? String(error)
                : 'Enter values for the following fields:'}
            </Text>
            {!loading &&
              !error &&
              typeof fields === 'object' &&
              Object.keys(fields).length > 0 &&
              Object.keys(fields).map(method => (
                <View key={method} style={styles.modalSection}>
                  <Text style={styles.modalLabel}>{method}</Text>
                  {(fields as Record<string, any[]>)[method].map(
                    (field: any) => {
                      // Check if this field is shared with other methods
                      const isSharedField = field.label === 'Existing W/C Limits' || 
                                           field.label === 'CREDIT PERIOD Offered' ||
                                           (field.label === 'Limit from banks' && (fields as any).Turnover);
                      
                      return (
                        <View key={field.id} style={{marginBottom: 10}}>
                          <Text style={styles.modalSubLabel}>
                            {field.label}
                            {isSharedField && (
                              <Text style={styles.sharedFieldText}> (Shared with Turnover)</Text>
                            )}
                          </Text>
                          <TextInput
                            style={styles.modalInput}
                            placeholder={
                              field.label.toLowerCase().includes('dependency') || 
                              field.label.toLowerCase().includes('dependancy') || 
                              field.label.toLowerCase().includes('percentage') || 
                              field.label.toLowerCase().includes('%')
                                ? `Enter value (e.g., 98.22 or 98)`
                                : `Enter value for ${field.label}`
                            }
                            keyboardType={
                              field.label.toLowerCase().includes('dependency') || 
                              field.label.toLowerCase().includes('dependancy') || 
                              field.label.toLowerCase().includes('percentage') || 
                              field.label.toLowerCase().includes('%')
                                ? "decimal-pad"
                                : "numeric"
                            }
                            value={inputValues[field.id]}
                            onChangeText={val => handleInputChange(field.id, val)}
                          />
                          {isSharedField && (
                            <Text style={styles.inputDescription}>
                              Please enter value same as turnover
                            </Text>
                          )}
                        </View>
                      );
                    }
                  )}
                </View>
              ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  dispatch(clearSoftSanctionFields());
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.runBtn}
                onPress={handleRun}>
                <Text style={styles.runText}>Run</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginVertical: 10,
    padding: 16,
    borderRadius: 8,
    borderColor: '#eee',
    borderWidth: 1,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  text: {
    color: '#555',
    marginBottom: 4,
  },
  button: {
    marginTop: scaleHeight(12),
    borderWidth: 1,
    borderColor: 'red',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: Colors.primaryColor,
    fontWeight: fontWeight.SemiBold,
    fontSize: scaleFont(16),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  modalSubLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelText: {
    marginRight: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  runBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  runText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    marginLeft: 4,
  },
  sharedFieldText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
});