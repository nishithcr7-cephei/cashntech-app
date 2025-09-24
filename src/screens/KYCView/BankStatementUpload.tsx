import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import {DocumentPickerResponse} from '@react-native-documents/picker';

import {RightCheckmark} from '@assets/Icons';
import {
  AppBar,
  Container,
  CustomDropdown,
  DashedButton,
  DateNTimePicker,
  Input,
  UploadModal,
} from '@components/index';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import fontWeight from '@constants/FontWeight';
import {
  kycActions,
  kycSelector,
  IBankStatementPayload,
} from '@store/kyc';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const BankStatementUpload = () => {
  const navigation = useNavigation<KycNavigationType>();
  const {params} = useRoute<RouteProp<KycNavigatorType, 'BankStatementUpload'>>();
  const [isVisible, setIsVisible] = useState(false);
  const [uploadType, setUploadType] = useState<'front' | 'back' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);

  const dispatch = useDispatch();
  const bankMasterList = useSelector(kycSelector.getBankMasterList);
  const bankResponse = useSelector(kycSelector.getBankStatement);
  const bankStatementInfo = useSelector(kycSelector.getBankStatementInfoData);
  const bankStatementInfoLoading = useSelector(kycSelector.getBankStatementInfoLoading);
  const bankStatementDetail = useSelector(kycSelector.getBankStatementDetailData);
  const bankStatementDetailLoading = useSelector(kycSelector.getBankStatementDetailLoading);

  // Bank Statement Interface
  interface BankEntry {
    bankName: string;
    accountNumber: string;
    accountType: string;
    reportingPeriod: string;
    startDate: string;
    endDate: string;
    uploadedFrontFile?: File | DocumentPickerResponse;
  }

  // Bank entries state
  const [bankEntries, setBankEntries] = useState<BankEntry[]>([
    {
      bankName: '',
      accountNumber: '',
      accountType: '',
      reportingPeriod: '',
      startDate: '',
      endDate: '',
      uploadedFrontFile: undefined,
    },
  ]);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);
  

  // Bank options - include master list and any additional banks from API
  const bankOptions = [
    ...bankMasterList.map(item => ({
      label: item.label,
      value: item.value,
    })),
    // Add any unique banks from bank statement info that aren't in master list
    ...(bankStatementInfo || [])
      .filter(bank => !bankMasterList.some(master => 
        master.value === bank.bank_name || master.label === bank.bank_name
      ))
      .map(bank => ({
        label: bank.bank_name,
        value: bank.bank_name,
      }))
  ];

  const accountTypeOptions = [
    {label: 'Savings Account', value: 'SAVINGS_ACCOUNT'},
    {label: 'Business Account', value: 'BUSINESS_ACCOUNT'},
    {label: 'Current Account', value: 'CURRENT_ACCOUNT'},
    {label: 'OD Account', value: 'OD_ACCOUNT'},
    {label: 'CC ACCOUNT', value: 'CC_ACCOUNT'},
    {label: 'VAN Account', value: 'VAN_ACCOUNT'},
  ];

  const reportingPeriodOptions = [
    {label: '3 months', value: '3months'},
    {label: '6 months', value: '6months'},
    {label: '12 months', value: '12months'},
  ];

  // Helper functions to map API values to dropdown values
  const mapBankNameToValue = (apiValue: string) => {
    // First try exact match
    let matchingBank = bankMasterList.find(bank => 
      bank.value === apiValue || bank.label === apiValue
    );
    
    // If no exact match, try case-insensitive match
    if (!matchingBank) {
      matchingBank = bankMasterList.find(bank => 
        bank.value?.toLowerCase() === apiValue?.toLowerCase() || 
        bank.label?.toLowerCase() === apiValue?.toLowerCase()
      );
    }
    
    // If still no match, try partial match
    if (!matchingBank) {
      matchingBank = bankMasterList.find(bank => 
        bank.value?.toLowerCase().includes(apiValue?.toLowerCase()) || 
        bank.label?.toLowerCase().includes(apiValue?.toLowerCase()) ||
        apiValue?.toLowerCase().includes(bank.value?.toLowerCase()) ||
        apiValue?.toLowerCase().includes(bank.label?.toLowerCase())
      );
    }
    
    return matchingBank ? matchingBank.value : apiValue;
  };

  const mapAccountTypeToValue = (apiValue: string) => {
    const mapping: {[key: string]: string} = {
      'Savings Account': 'SAVINGS_ACCOUNT',
      'Business Account': 'BUSINESS_ACCOUNT',
      'Current Account': 'CURRENT_ACCOUNT',
      'OD Account': 'OD_ACCOUNT',
      'CC ACCOUNT': 'CC_ACCOUNT',
      'VAN Account': 'VAN_ACCOUNT',
    };
    return mapping[apiValue] || apiValue;
  };

  const mapReportingPeriodToValue = (apiValue: string) => {
    const mapping: {[key: string]: string} = {
      '3 months': '3months',
      '6 months': '6months',
      '12 months': '12months',
    };
    return mapping[apiValue] || apiValue;
  };

  const [errors, setErrors] = useState<Record<string, boolean>>({
    bankName: false,
    accountNumber: false,
    accountType: false,
    reportingPeriod: false,
    startDate: false,
    endDate: false,
    uploadedFrontFile: false,
  });

  useEffect(() => {
    dispatch(kycActions.getBankList());
    // Fetch bank statement info for the client
    if (params.clientID) {
      dispatch(kycActions.getBankStatementInfoRequest(params.clientID.toString()));
    }
  }, []);

  useEffect(() => {
    if (bankResponse) {
      Toast.show({
        type: 'success',
        text1: 'All Data submitted successfully',
      });
      handleClear();
    }
  }, [bankResponse]);

  useEffect(() => {
    if (bankStatementInfo && bankStatementInfo.length > 0) {
      // You can use this data to pre-populate the form or show existing bank statements
    }
  }, [bankStatementInfo]);

  useEffect(() => {
    if (bankStatementDetail) {
      // Auto-fill the form with the bank statement detail data
      const newBankEntry: BankEntry = {
        bankName: mapBankNameToValue(bankStatementDetail.bank_name),
        accountNumber: bankStatementDetail.account_number,
        accountType: mapAccountTypeToValue(bankStatementDetail.acount_type),
        reportingPeriod: mapReportingPeriodToValue(bankStatementDetail.statement_duration),
        startDate: moment(bankStatementDetail.statement_from, 'YYYY-MM-DD').format('DD-MM-YYYY'),
        endDate: moment(bankStatementDetail.statement_to, 'YYYY-MM-DD').format('DD-MM-YYYY'),
        uploadedFrontFile: undefined,
      };
      
      // Replace the first bank entry with the fetched data
      setBankEntries([newBankEntry]);
      setCurrentEditingIndex(0);
      setShowBankForm(true);
      
      // Clear the bank statement detail data after using it
      dispatch(kycActions.clearBankStatementDetail());
    }
  }, [bankStatementDetail]);

  // Add new bank entry
  const handleAddBank = () => {
    setBankEntries([
      ...bankEntries,
      {
        bankName: '',
        accountNumber: '',
        accountType: '',
        reportingPeriod: '',
        startDate: '',
        endDate: '',
        uploadedFrontFile: undefined,
      },
    ]);
    setCurrentEditingIndex(bankEntries.length);
  };

  // Remove bank entry
  const handleRemoveBank = (index: number) => {
    if (bankEntries.length <= 1) return;
    const updatedBanks = bankEntries.filter((_, i) => i !== index);
    setBankEntries(updatedBanks);
    setCurrentEditingIndex(
      Math.min(currentEditingIndex, updatedBanks.length - 1),
    );
  };

  // Update bank entry field
  const updateBankEntry = (
    index: number,
    field: keyof BankEntry,
    value: any,
  ) => {
    const updatedBanks = [...bankEntries];
    updatedBanks[index][field] = value;
    setBankEntries(updatedBanks);

    // Clear error if field is filled
    if (errors[`${field}_${index}`] && value?.toString().trim()) {
      setErrors(prev => ({...prev, [`${field}_${index}`]: false}));
    }
  };

  // Submit bank statements
  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};

    bankEntries.forEach((bank, index) => {
      if (!bank.bankName.trim()) newErrors[`bankName_${index}`] = true;
      if (!bank.accountNumber.trim())
        newErrors[`accountNumber_${index}`] = true;
      if (!bank.accountType.trim()) newErrors[`accountType_${index}`] = true;
      if (!bank.reportingPeriod.trim())
        newErrors[`reportingPeriod_${index}`] = true;
      if (!bank.startDate.trim()) newErrors[`startDate_${index}`] = true;
      if (!bank.endDate.trim()) newErrors[`endDate_${index}`] = true;
      if (!bank.uploadedFrontFile)
        newErrors[`uploadedFrontFile_${index}`] = true;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      let missingFields: string[] = [];
      bankEntries.forEach((bank, index) => {
        if (!bank.bankName.trim())
          missingFields.push(`Bank Name (Bank ${index + 1})`);
        if (!bank.accountNumber.trim())
          missingFields.push(`Account Number (Bank ${index + 1})`);
        if (!bank.accountType.trim())
          missingFields.push(`Account Type (Bank ${index + 1})`);
        if (!bank.reportingPeriod.trim())
          missingFields.push(`Report Period (Bank ${index + 1})`);
        if (!bank.startDate.trim())
          missingFields.push(`Start Date of Statement (Bank ${index + 1})`);
        if (!bank.endDate.trim())
          missingFields.push(`End Date of Statement (Bank ${index + 1})`);
        if (!bank.uploadedFrontFile)
          missingFields.push(`Upload Statement (Bank ${index + 1})`);
      });

      Alert.alert(
        'Missing Fields',
        `Please provide the following:\n${missingFields.join('\n')}`,
      );
      return;
    }

    // Prepare payload for API
    const payload: IBankStatementPayload = {
      clientId: Number(params.clientID),
      uploaded_by: getUserFullName(),
      doc: bankEntries.map(bank => ({
        account_number: bank.accountNumber,
        statement_duration: bank.reportingPeriod,
        bank_name: bank.bankName,
        acount_type: bank.accountType,
        statement_from: moment(bank.startDate, 'DD-MM-YYYY').format(
          'YYYY-MM-DD',
        ),
        statement_to: moment(bank.endDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
      })),
      files: bankEntries
        .map(bank => bank.uploadedFrontFile)
        .filter(Boolean) as File[],
    };

    setLoading(true);
    dispatch(kycActions.bankStatementRequest(payload));
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Documents Uploaded',
        text2: `${bankEntries.length} Bank Statements Submitted Successfully`,
      });
      handleClear();
    }, 1500);
  };

  // Handle bank card click to fetch details
  const handleBankCardClick = (bankId: number) => {
    dispatch(kycActions.getBankStatementDetailRequest(bankId.toString()));
  };

  // Clear all bank entries
  const handleClear = () => {
    setBankEntries([
      {
        bankName: '',
        accountNumber: '',
        accountType: '',
        reportingPeriod: '',
        startDate: '',
        endDate: '',
        uploadedFrontFile: undefined,
      },
    ]);
    setCurrentEditingIndex(0);
    setErrors({
      bankName: false,
      accountNumber: false,
      accountType: false,
      reportingPeriod: false,
      startDate: false,
      endDate: false,
      uploadedFrontFile: false,
    });
  };

  // Bank Entry Form Component
  const BankEntryForm = ({bank, index}: {bank: BankEntry; index: number}) => (
    <View style={styles.bankEntryContainer}>
      {bankEntries.length > 1 && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveBank(index)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setCurrentEditingIndex(index)}>
        <Text
          style={[
            styles.bankTitle,
            {
              color: currentEditingIndex === index ? Colors.primaryColor : '#666',
            },
          ]}>
          Bank {index + 1}{' '}
          {currentEditingIndex !== index ? '(Tap to edit)' : ''}
        </Text>
      </TouchableOpacity>

      {currentEditingIndex === index && (
        <>
          <CustomDropdown
            label="Bank Name"
            data={bankOptions}
            value={bank.bankName}
            onChange={val => updateBankEntry(index, 'bankName', val)}
            containerStyle={{
              marginBottom: scaleHeight(20),
              borderColor: errors[`bankName_${index}`] ? Colors.red : undefined,
            }}
          />

          <Input
            label="Account Number"
            value={bank.accountNumber}
            onChangeText={text => {
              const numericOnly = text.replace(/[^0-9]/g, '');
              const formatted = numericOnly.slice(0, 18);
              updateBankEntry(index, 'accountNumber', formatted);
            }}
            containerStyle={{
              marginBottom: scaleHeight(20),
              borderColor: errors[`accountNumber_${index}`]
                ? Colors.red
                : undefined,
            }}
          />

          <CustomDropdown
            label="Account Type"
            data={accountTypeOptions}
            value={bank.accountType}
            onChange={val => updateBankEntry(index, 'accountType', val)}
            containerStyle={{
              marginBottom: scaleHeight(20),
              borderColor: errors[`accountType_${index}`]
                ? Colors.red
                : undefined,
            }}
          />

          <CustomDropdown
            label="Reporting Period"
            data={reportingPeriodOptions}
            value={bank.reportingPeriod}
            onChange={val => updateBankEntry(index, 'reportingPeriod', val)}
            containerStyle={{
              marginBottom: scaleHeight(20),
              borderColor: errors[`reportingPeriod_${index}`]
                ? Colors.red
                : undefined,
            }}
          />

          <DateNTimePicker
            label="Start Date"
            value={bank.startDate}
            onConfirm={date => {
              const formatted = moment(date).format('DD-MM-YYYY');
              updateBankEntry(index, 'startDate', formatted);
            }}
            datePickerProps={{
              mode: 'date',
              maximumDate: new Date(),
            }}
            containerStyle={{
              marginBottom: scaleHeight(20),
              borderColor: errors[`startDate_${index}`]
                ? Colors.red
                : undefined,
            }}
          />

          <DateNTimePicker
            label="End Date"
            value={bank.endDate}
            onConfirm={date => {
              const formatted = moment(date).format('DD-MM-YYYY');
              updateBankEntry(index, 'endDate', formatted);
            }}
            datePickerProps={{
              mode: 'date',
              minimumDate: bank.startDate
                ? moment(bank.startDate, 'DD-MM-YYYY').toDate()
                : undefined,
              maximumDate: new Date(),
            }}
            containerStyle={{
              marginBottom: scaleHeight(20),
              borderColor: errors[`endDate_${index}`] ? Colors.red : undefined,
            }}
          />

          {bank.uploadedFrontFile ? (
            <Text style={styles.uploadedFileText}>
              Statement : {bank.uploadedFrontFile.name}
            </Text>
          ) : (
            <DashedButton
              label="Upload Statement"
              onPress={() => {
                setUploadType('front');
                setCurrentEditingIndex(index);
                setIsVisible(true);
              }}
              containerStyle={{
                borderColor: errors[`uploadedFrontFile_${index}`]
                  ? Colors.red
                  : undefined,
              }}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <Container>
      {(loading || bankStatementDetailLoading) && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          {bankStatementDetailLoading && (
            <Text style={styles.loadingText}>Loading bank details...</Text>
          )}
        </View>
      )}
      <AppBar title="Bank Statement Upload" navigation={navigation} />
      <View style={styles.subContainer}>
        <Text style={styles.subHeader}>Bank Statement Upload</Text>
      </View>
      <ScrollView style={styles.container}>
        <View>
          <Text style={styles.heading}>
            Let's Upload Your Bank Statements
          </Text>
          <Text style={styles.subHeading}>
            Please provide the required bank statements to verify your
            financial details
          </Text>

          {/* Display existing bank statement info */}
          {bankStatementInfoLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Loading existing bank statements...</Text>
            </View>
          )}

          {/* Display existing bank statements as cards */}
          {bankStatementInfo && bankStatementInfo.length > 0 && (
            <View style={styles.existingBankSection}>
              <Text style={styles.existingBankTitle}>Existing Bank Statements:</Text>
              
              {bankStatementInfo.map((bank, index) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.existingBankCard,
                    {backgroundColor: Colors.frostedPlains}
                  ]}
                  onPress={() => handleBankCardClick(bank.id)}
                  disabled={bankStatementDetailLoading}>
                  <Text style={styles.existingBankCardText}>{bank.bank_name}</Text>
                  {bankStatementDetailLoading ? (
                    <ActivityIndicator size="small" color={Colors.primaryColor} />
                  ) : (
                    <RightCheckmark width={20} height={20} color="black" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!showBankForm ? (
            <TouchableOpacity
              style={styles.addBankButton}
              onPress={() => setShowBankForm(true)}>
              <Text style={styles.addBankText}>
                Add Bank Statement
              </Text>
              <Text style={styles.addBankPlus}>＋</Text>
            </TouchableOpacity>
          ) : (
            <>
              {bankEntries.map((bank, index) => (
                <BankEntryForm key={index} bank={bank} index={index} />
              ))}

              <TouchableOpacity
                style={styles.addBankButton}
                onPress={handleAddBank}>
                <Text style={styles.addBankText}>
                  Add Another Bank
                </Text>
                <Text style={styles.addBankPlus}>＋</Text>
              </TouchableOpacity>

              <UploadModal
                visible={isVisible}
                allowedFileTypes={['pdf']}
                onClose={file => {
                  if (file) {
                    updateBankEntry(
                      currentEditingIndex,
                      'uploadedFrontFile',
                      file,
                    );
                  }
                  setIsVisible(false);
                  setUploadType(null);
                }}
              />

              <View style={styles.footerButton}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    activeOpacity={0.7}
                    onPress={handleSubmit}>
                    <Text style={styles.saveText}>Save</Text>
                    <RightCheckmark width={12} height={12} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  subContainer: {
    backgroundColor: '#fff',
  },
  subHeader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  heading: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginBottom: 12,
  },
  subHeading: {
    fontSize: scaleFont(14),
    color: '#666',
    marginBottom: 16,
  },
  bankEntryContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
    borderRadius: 5,
  },
  removeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  removeText: {
    color: 'red',
  },
  bankTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  uploadedFileText: {
    marginBottom: 10,
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2.5,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    alignSelf: 'flex-start',
    marginTop: scaleHeight(24),
    minWidth: scaleWidth(110),
  },
  addBankText: {
    fontSize: scaleFont(14),
    color: '#7A7A7A',
    fontWeight: fontWeight.Medium,
  },
  addBankPlus: {
    fontSize: scaleFont(16),
    color: '#7A7A7A',
    fontWeight: fontWeight.Bold,
    marginLeft: scaleWidth(6),
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  clearButton: {},
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    gap: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.green,
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(10),
    marginBottom: scaleHeight(16),
  },
  loadingText: {
    marginLeft: scaleWidth(8),
    fontSize: scaleFont(14),
    color: Colors.primaryColor,
  },
  existingBankSection: {
    marginBottom: scaleHeight(16),
  },
  existingBankTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginBottom: scaleHeight(12),
    color: '#333',
  },
  existingBankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: scaleWidth(8),
    padding: scaleHeight(12),
    marginBottom: scaleHeight(12),
    backgroundColor: '#fafafa',
  },
  existingBankCardText: {
    fontSize: scaleFont(16),
    color: '#333',
    flex: 1,
  },
});
