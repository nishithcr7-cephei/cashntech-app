import {RightCheckmark, RightChevron} from '@assets/Icons';
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
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  clientActions,
  clientSelector,
  IBankStatementPayload,
} from '@store/client';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import moment from 'moment';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {Api} from '@services/api';
import {DocumentPickerResponse} from 'react-native-document-picker';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const KYCFormSelection = () => {
  const navigation = useNavigation<KycNavigationType>();
  const {params} = useRoute<RouteProp<KycNavigatorType, 'KYCFormSelection'>>();
  const [isVisible, setIsVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploadType, setUploadType] = useState<'front' | 'back' | null>(null);
  const [uploadedFrontFile, setUploadedFrontFile] = useState<
    File | DocumentPickerResponse | undefined
  >();
  const [uploadedBackFile, setUploadedBackFile] = useState<
    File | DocumentPickerResponse | undefined
  >();

  const [loading, setLoading] = useState(false);
  const [bankList, setBankList] = useState<{label: string; value: string}[]>(
    [],
  );

  const dispatch = useDispatch();
  const kycChecked = useSelector(clientSelector.getkycChecked);
  const KycBusinessChecked =
    useSelector(clientSelector.getBusinessChecked) || [];

  const bankResponse = useSelector(clientSelector.getBankStatement);
  
  

  const checkedKyc = () => {
    dispatch(clientActions.getKycChecked(params.clientID.toString()));
  };
  const CheckedBusinessKyc = () => {
    dispatch(clientActions.getKycBusinessChecked(params.clientID.toString()));
  };

  useEffect(() => {
    checkedKyc();
  }, []);

  useEffect(() => {
    CheckedBusinessKyc();
  }, []);

  useEffect(() => {
  if (bankResponse) {
    Toast.show({
      type: 'success',
      text1: 'All Data submitted successfully',
    });
    setBankName('');
    setAccountNumber('');
    setAccountType('');
    setReportingPeriod('');
    setStartDate('');
    setEndDate('');
    setUploadedFrontFile(undefined);
    setUploadedBackFile(undefined);
  }
  // If you have an error selector, add this:
  // else if (bankError) {
  //   Toast.show({
  //     type: 'error',
  //     text1: 'Something went wrong',
  //   });
  // }
}, [bankResponse /*, bankError*/]);

  useEffect(() => {
    Api.get('/client-info-master/bankmaster-list').then(res => {
      if (res?.data?.data) {
        setBankList(
          res.data.data.map((b: any) => ({
            label: b.bank_name,
            value: b.bank_name,
          })),
        );
      }
    });
  }, []);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('');
  const [reportingPeriod, setReportingPeriod] = useState('');
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

  const [errors, setErrors] = useState({
    bankName: false,
    accountNumber: false,
    accountType: false,
    reportingPeriod: false,
    startDate: false,
    endDate: false,
    uploadedFrontFile: false,
    uploadedBackFile: false,
  });

  const handleClear = () => {
    setBankName('');
    setAccountNumber('');
    setAccountType('');
    setReportingPeriod('');
    setStartDate('');
    setEndDate('');
    setUploadedFrontFile(undefined);
    setUploadedBackFile(undefined);
  };

  const handleSubmit = () => {
    if (
      !bankName ||
      !accountNumber ||
      !accountType ||
      !reportingPeriod ||
      !startDate ||
      !endDate ||
      !uploadedFrontFile ||
      !uploadedBackFile
    ) {
      setErrors({
        bankName: !bankName,
        accountNumber: !accountNumber,
        accountType: !accountType,
        reportingPeriod: !reportingPeriod,
        startDate: !startDate,
        endDate: !endDate,
        uploadedFrontFile: !uploadedFrontFile,
        uploadedBackFile: !uploadedBackFile,
      });

      let missingFields = [];
      if (!bankName) missingFields.push('Bank Name');
      if (!accountNumber) missingFields.push('Account Number');
      if (!accountType) missingFields.join('Account Type');
      if (!reportingPeriod) missingFields.push('Report Period');
      if (!startDate) missingFields.push('Start Date of Statement');
      if (!endDate) missingFields.push('End Date of Statement');
      if (!uploadedFrontFile) missingFields.push('Upload Statement 1');
      if (!uploadedBackFile) missingFields.push('Upload Statement 2');

      Alert.alert(
        'Missing Fields',
        `Please provide the following:\n${missingFields.join('\n')}`,
      );
      return;
    }
    setErrors({
      bankName: false,
      accountNumber: false,
      accountType: false,
      reportingPeriod: false,
      startDate: false,
      endDate: false,
      uploadedFrontFile: false,
      uploadedBackFile: false,
    });

    const payload: IBankStatementPayload = {
      clientId: params.clientID,
      uploaded_by: getUserFullName(),
      doc: [
        {
          account_number: accountNumber,
          statement_duration: reportingPeriod,
          bank_name: bankName,
          acount_type: accountType,
          statement_from: moment(startDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
          statement_to: moment(endDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        },
      ],
      files: [uploadedFrontFile, uploadedBackFile],
    };

    setLoading(true);
    dispatch(clientActions.bankStatementRequest(payload));
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Document Uplaoded',
        text2: `${bankName}'s Statement Submitted Successfully`,
      });
      handleClear();
    }, 1500);
  };

  const personalDocs = [
    {label: 'Upload your Picture', key: 'profile'},
    {label: 'PAN Card Details', key: 'pan'},
    {label: 'Aadhar Card Details', key: 'aadhaar'},
    {label: 'Residence Details', key: 'residence'},
  ];

  const businessDocs = [
    {label: 'Udhyam Certificate', key: 'udyam'},
    {label: 'GST Documents', key: 'gst'},
    {label: 'Godown Details', key: 'godown'},
    {label: 'Company PAN Card Details', key: 'company_pan'},
    {label: 'Shareholding Details', key: 'shareholding'},
    {label: 'Company Information', key: 'company_info'},
  ];

  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'bank'>(
    'personal',
  );

  const handleNavigation = (text: string) => {
    const navMap: {
      [key: string]:
        | 'KycUploadDoc'
        | 'KycUploadPan'
        | 'KycUploadAdhar'
        | 'ResidenceDetail';
    } = {
      'Upload your Picture': 'KycUploadDoc',
      'PAN Card Details': 'KycUploadPan',
      'Aadhar Card Details': 'KycUploadAdhar',
      'Residence Details': 'ResidenceDetail',
    };
    const screen = navMap[text];
    screen
      ? navigation.navigate(screen, {clientID: params.clientID})
      : console.warn('Screen not found for', text);
  };

  const handleNavigation2 = (text: string) => {
    const navMap: {
      [key: string]:
        | 'UdhyamCertificate'
        | 'GSTDocument'
        | 'GodownDetails'
        | 'CompanyPanCard'
        | 'ShareholdingCompany'
        | 'CompanyDocument';
    } = {
      'Udhyam Certificate': 'UdhyamCertificate',
      'GST Documents': 'GSTDocument',
      'Godown Details': 'GodownDetails',
      'Company PAN Card Details': 'CompanyPanCard',
      'Shareholding Details': 'ShareholdingCompany',
      'Company Information': 'CompanyDocument',
    };
    const screen = navMap[text];
    screen
      ? navigation.navigate(screen, {clientID: params.clientID})
      : console.warn('Screen not found for', text);
  };

  const renderList = (
    docs: {label: string; key: string}[],
    handler: (label: string) => void,
  ) =>
    docs.map(({label, key}, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.card,
          kycChecked.includes(key)
            ? {backgroundColor: Colors.frostedPlains}
            : {},
        ]}
        onPress={() => handler(label)}>
        <Text style={styles.cardText}>{label}</Text>
        {kycChecked.includes(key) ? (
          <RightCheckmark width={20} height={20} />
        ) : (
          <RightChevron width={20} height={17} />
        )}
      </TouchableOpacity>
    ));

  const renderlist = (
    docs: {label: string; key: string}[],
    handler: (label: string) => void,
  ) =>
    docs.map(({label, key}, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.card,
          KycBusinessChecked.includes(key)
            ? {backgroundColor: Colors.frostedPlains}
            : {},
        ]}
        onPress={() => handler(label)}>
        <Text style={styles.cardText}>{label}</Text>
        {KycBusinessChecked.includes(key) ? (
          <RightCheckmark width={20} height={20} />
        ) : (
          <RightChevron width={20} height={17} />
        )}
      </TouchableOpacity>
    ));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <View>
            <Text style={styles.heading}>
              Let’s Verify and Upload Documents
            </Text>
            <Text style={styles.subHeading}>
              Please Submit the following documents to verify your profile
            </Text>
            {renderList(personalDocs, handleNavigation)}
          </View>
        );
      case 'business':
        return (
          <View>
            <Text style={styles.heading}>
              Let’s Verify and Upload Documents
            </Text>
            <Text style={styles.subHeading}>
              Please Submit the following documents to verify your profile
            </Text>
            {renderlist(businessDocs, handleNavigation2)}
          </View>
        );
      case 'bank':
        return (
          <View>
            <Text style={styles.heading}>Bank Statement of Last 12 Months</Text>
            <CustomDropdown
              label="Bank Name"
              data={bankList}
              value={bankName}
              onChange={val => setBankName(val)}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />
            <Input
              label="Account Number"
              value={accountNumber}
              onChangeText={text => {
                const numericOnly = text.replace(/[^0-9]/g, '');
                const formatted = numericOnly.slice(0, 18);
                setAccountNumber(formatted);
                if (errors.accountNumber && formatted.trim()) {
                  setErrors(prev => ({...prev, accountNumber: false}));
                }
              }}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />

            <CustomDropdown
              label="Account Type"
              data={accountTypeOptions}
              value={accountType}
              onChange={val => setAccountType(val)}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />
            <CustomDropdown
              label="Reporting Period"
              data={reportingPeriodOptions}
              value={reportingPeriod}
              onChange={val => setReportingPeriod(val)}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />

            {/* 👉 Replace these Inputs with Date Pickers */}
            <DateNTimePicker
              label="Start Date"
              value={startDate}
              onConfirm={date => {
                const formatted = moment(date).format('DD-MM-YYYY');
                setStartDate(formatted);
              }}
              datePickerProps={{
                mode: 'date',
                maximumDate: new Date(),
              }}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />

            <DateNTimePicker
              label="End Date"
              value={endDate}
              onConfirm={date => {
                const formatted = moment(date).format('DD-MM-YYYY');
                setEndDate(formatted);
              }}
              datePickerProps={{
                mode: 'date',
                minimumDate: startDate
                  ? moment(startDate, 'DD-MM-YYYY').toDate()
                  : undefined,
                maximumDate: new Date(),
              }}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />

            {/* Upload Front Statement */}
            {uploadedFrontFile ? (
              <Text style={{marginBottom: 10}}>
                Front File: {uploadedFrontFile.name}
              </Text>
            ) : (
              <DashedButton
                label="Upload Statement"
                onPress={() => {
                  setUploadType('front');
                  setIsVisible(true);
                }}
              />
            )}

            {uploadedBackFile ? (
              <Text style={{marginBottom: 10}}>
                Back File: {uploadedBackFile.name}
              </Text>
            ) : (
              <DashedButton
                label="Upload Statement"
                onPress={() => {
                  setUploadType('back');
                  setIsVisible(true);
                }}
                containerStyle={{marginBottom: scaleHeight(15)}}
              />
            )}

            <UploadModal
              visible={isVisible}
              onClose={file => {
                if (file) {
                  if (uploadType === 'front') setUploadedFrontFile(file);
                  if (uploadType === 'back') setUploadedBackFile(file);
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
                  style={[styles.saveButton, {backgroundColor: Colors.white}]}
                  activeOpacity={0.7}>
                  <Text style={[styles.saveText, {color: Colors.green}]}>
                    Save
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  activeOpacity={0.7}
                  onPress={handleSubmit}>
                  <Text style={styles.saveText}>Submit</Text>
                  <RightCheckmark width={12} height={12} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <Container>
      <AppBar title="Kyc Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Kyc Document</Text>
      </View>
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabRow}>
          {['Personal KYC', 'Business KYC', 'Bank Statement'].map(
            (label, index) => {
              const key = label.toLowerCase().split(' ')[0] as
                | 'personal'
                | 'business'
                | 'bank';
              return (
                <TouchableOpacity
                  key={label}
                  style={styles.tab}
                  onPress={() => setActiveTab(key)}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === key && styles.activeTabText,
                    ]}>
                    {label}
                  </Text>
                  {activeTab === key && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            },
          )}
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  Subcontainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: Colors.primaryColor,
    fontWeight: fontWeight.SemiBold,
  },
  activeIndicator: {
    height: 3,
    width: '100%',
    backgroundColor: Colors.primaryColor,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginBottom: 24,
  },
  subHeading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 18,
    color: '#888',
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
});
