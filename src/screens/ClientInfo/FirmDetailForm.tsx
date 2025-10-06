import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect} from 'react';
import {LeftChevronCircle} from '@assets/Icons';
import {
  Container,
  AppBar,
  Input,
  CustomDropdown,
  MultiSelectDropdown,
  FooterButton,
} from '@components/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType} from '@type/NavigatorTypes';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector, FirmDetailsType} from '@store/client';
import Toast from 'react-native-toast-message';
import {ClientScreens} from '@constants/Screens';
import {formatIndianNumber} from '@utils/Utils';
import {
  CreditPeriodOffer,
  FacilityType,
  FirmType,
  IndustryType,
  SectorType,
  industrySectorMapping,
} from './ClientInfo.type';

const listOfFirmTypes = Object.values(FirmType).map(item => ({
  label: item,
  value: item,
}));

const listOfIndustries = Object.values(IndustryType).map(item => ({
  label: item,
  value: item,
}));

const listOfSectors = Object.values(SectorType).map(item => ({
  label: item,
  value: item,
}));

const listOfFacilityTypes = Object.values(FacilityType).map(item => ({
  label: item,
  value: item,
}));

const listOfCreditPeriodOffer = Object.values(CreditPeriodOffer)
  .map(item => ({
    label: item,
    value: item,
  }))
  .sort((a, b) => Number(a.value) - Number(b.value));

type Props = NativeStackScreenProps<ClientNavigatorType, 'FirmDetailForm'>;

export const FirmDetailForm: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch();

  const listOfBanks = useSelector(clientSelector.getMasterBankDropdown);

  useEffect(() => {
    dispatch(clientActions.getMasterBankList());
  }, [dispatch]);


  const {
    firmType,
    businessVintage,
    industry,
    sector,
    bankName,
    cibilScore,
    facilityType,
    annualTurnover,
    existingFundingSanctionedAmount,
    estimatedFundingRequired,
    creditPeriodOffer,
  } = useSelector(clientSelector.getFirmDetailsFormData);

  const firmLoader = useSelector(clientSelector.getClientLoader);
  const isSavedFirmDetails = useSelector(
    clientSelector.getFirmDetailsFormStatus,
  );

  function setData<T extends keyof FirmDetailsType>(
    field: T,
    value: FirmDetailsType[T],
  ) {
    dispatch(clientActions.setFirmDetails({[field]: value}));
  }

  // Get filtered sectors based on selected industry
  const getFilteredSectors = () => {
    if (!industry) {
      return listOfSectors;
    }
    const industryKey = industry as IndustryType;
    const sectorsForIndustry = industrySectorMapping[industryKey] || [];
    return sectorsForIndustry.map(sector => ({
      label: sector,
      value: sector,
    }));
  };

  // Handle industry change and reset sector
  const handleIndustryChange = (value: string) => {
    setData('industry', value);
    setData('sector', ''); // Reset sector when industry changes
  };

  const handleClear = () => {
    dispatch(clientActions.clearFirmDetails());
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    const strip = (s: string | undefined) =>
      s ? s.toString().replace(/,/g, '') : '';
    
    const firmDetailsToSave = {
      annualTurnover: strip(annualTurnover),
      existingFundingSanctionedAmount: strip(existingFundingSanctionedAmount),
      estimatedFundingRequired: strip(estimatedFundingRequired),
      bankName: bankName, // Ensure bank names are included in save
    };
    
    dispatch(clientActions.setFirmDetails(firmDetailsToSave));
    dispatch(clientActions.saveFirmDetails());
  };

  const handleNext = () => {
    if (isSavedFirmDetails) {
      navigation.navigate(ClientScreens.VendorDetailForm);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please save the form before proceeding to next step.',
      });
    }
  };

  const requiredFields = [
    {field: firmType, name: 'Type of Firm'},
    {field: businessVintage, name: 'Business Vintage'},
    {field: industry, name: 'Industry'},
    {field: sector, name: 'Sector'},
    {field: bankName, name: 'Bank Name'},
    {field: annualTurnover, name: 'Annual Turnover'},
    {field: cibilScore, name: 'CIBIL Score'},
    {field: facilityType, name: 'Facility Type'},
    {
      field: existingFundingSanctionedAmount,
      name: 'Existing Funding Sanctioned Amt',
    },
    {field: estimatedFundingRequired, name: 'Estimated Funding Required'},
    {field: creditPeriodOffer, name: 'Credit Period Offer (In Days)'},
  ];

  const validateForm = () => {
    for (let i = 0; i < requiredFields.length; i++) {
      const {field, name} = requiredFields[i];
      if (name === 'Bank Name' || name === 'Facility Type') {
        // Special validation for bank names and facility type arrays
        if (!field || !Array.isArray(field) || field.length === 0) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: `Please select at least one ${name}`,
          });
          return false;
        }
      } else if (!field || (typeof field === 'string' && !field.trim())) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: `Please enter/select ${name}`,
        });
        return false;
      }
    }
    return true;
  };

  return (
    <Container>
      <AppBar title="Client Information Master" />
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>Firm Details</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingScrollView style={{flexGrow: 1}}>
        <View style={styles.inputContainer}>
          <CustomDropdown
            label="Type of Firm"
            data={listOfFirmTypes}
            value={firmType}
            onChange={value => setData('firmType', value)}
          />
          <Input
            label="Business Vintage (in Years)"
            placeholder="Enter Business vintage"
            value={businessVintage}
            keyboardType="numeric"
            maxLength={3}
            onChangeText={value => setData('businessVintage', value)}
          />
          <CustomDropdown
            label="Industry"
            data={listOfIndustries}
            value={industry}
            onChange={handleIndustryChange}
          />
          <CustomDropdown
            label="Sector"
            data={getFilteredSectors()}
            value={sector}
            onChange={value => setData('sector', value)}
          />
          <MultiSelectDropdown
            label="Bank Name"
            data={listOfBanks}
            value={bankName}
            onChange={value => {
              setData('bankName', value);
            }}
            placeholder="Select multiple banks"
          />
          <Input
            label="Annual Turnover"
            placeholder="Enter Annual Turnover"
            keyboardType="numeric"
            value={formatIndianNumber(annualTurnover)}
            onChangeText={value => setData('annualTurnover', value)}
          />
          <Input
            label="CIBIL Score"
            placeholder="Enter CIBIL score"
            value={cibilScore}
            keyboardType="numeric"
            maxLength={3}
            onChangeText={value => setData('cibilScore', value)}
          />
          <MultiSelectDropdown
            label="Facility Type"
            data={listOfFacilityTypes}
            value={facilityType}
            onChange={value => {
              setData('facilityType', value);
            }}
            placeholder="Select multiple facility types"
          />
          <Input
            label="Existing Funding Sanctioned Amt"
            placeholder="Enter Funding Amount"
            keyboardType="numeric"
            value={formatIndianNumber(existingFundingSanctionedAmount)}
            onChangeText={value =>
              setData('existingFundingSanctionedAmount', value)
            }
          />
          <Input
            label="Estimated Funding Required"
            placeholder="Enter funding required"
            keyboardType="numeric"
            value={formatIndianNumber(estimatedFundingRequired)}
            onChangeText={value => setData('estimatedFundingRequired', value)}
          />
          <CustomDropdown
            label="Credit Period Offer (In Days)"
            data={listOfCreditPeriodOffer}
            value={creditPeriodOffer}
            dropdownPosition="bottom"
            onChange={value => setData('creditPeriodOffer', value)}
            showSearch={false}
          />
        </View>
      </KeyboardAvoidingScrollView>
      <FooterButton
        onPressClearAll={handleClear}
        onPressSave={handleSave}
        onPressNext={handleNext}
        showNext={true}
      />
      <Modal transparent visible={firmLoader}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LimeGray,
    paddingLeft: 16,
    paddingVertical: 12,
  },
  subheader: {
    marginLeft: 12,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
  },
  inputContainer: {
    marginHorizontal: scaleWidth(24),
    marginTop: scaleHeight(17),
    gap: scaleHeight(20),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
