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
import {formatIndianNumber} from '@utils/numberFormatter';

export enum FirmType {
  CHARITY = 'CHARITY',
  EDUCATIONAL_INSTITUTE = 'EDUCATIONAL_INSTITUTE',
  GOVERNMENT = 'GOVERNMENT',
  HUF = 'HUF',
  INDIVIDUAL_SALARIED = 'INDIVIDUAL/SALARIED',
  LIMITED_LIABILITY_PARTNERSHIP = 'LIMITED LIABILITY PARTNERSHIP',
  MNC = 'MNC',
  NON_GOVERNMENT_ORGANIZATION = 'NON GOVERNMENT ORGANIZATION',
  PARTNERSHIP = 'Partnership',
  PRIVATE_LTD = 'Private Ltd',
  PROPRIETORSHIP = 'Proprietorship',
  PUBLIC_LTD = 'Public Ltd',
  TRUST = 'TRUST',
}

export enum SectorType {
  FMCG = 'FMCG',
  PAINT = 'Paint',
  MANUFACTURING = 'Manufacturing',
  PHARMA = 'Pharma',
  ELECTRONIC = 'Electronic',
}

export enum FacilityType {
  OD = 'OD - Overdraft',
  CC = 'CC - Cash Credit',
  WCTL = 'WCTL - Working Capital Term Loan',
  CF = 'CF - Cashn Flow',
  OTHERS = 'Others',
}

export enum CreditPeriodOffer {
  DAYS_30 = '30',
  DAYS_45 = '45',
  DAYS_60 = '60',
  DAYS_90 = '90',
}

const listOfFirmTypes = Object.values(FirmType).map(item => ({
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

const listOfCreditPeriodOffer = Object.values(CreditPeriodOffer).map(item => ({
  label: item,
  value: item,
}));

type Props = NativeStackScreenProps<ClientNavigatorType, 'FirmDetailForm'>;

export const FirmDetailForm = ({navigation}: Props) => {
  const dispatch = useDispatch();

  const listOfBanks = useSelector(clientSelector.getMasterBankDropdown);

  useEffect(() => {
    dispatch(clientActions.getMasterBankList());
  }, [dispatch]);

  const {
    firmType,
    businessVintage,
    sector,
    bankName,
    cibilScore,
    facilityType,
    monthlyTurnover,
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

  const handleClear = () => {
    dispatch(clientActions.clearFirmDetails());
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const strip = (s: string | undefined) =>
      s ? s.toString().replace(/,/g, '') : '';
    dispatch(
      clientActions.setFirmDetails({
        monthlyTurnover: strip(monthlyTurnover),
        existingFundingSanctionedAmount: strip(existingFundingSanctionedAmount),
        estimatedFundingRequired: strip(estimatedFundingRequired),
      }),
    );
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
    {field: sector, name: 'Sector'},
    {field: bankName, name: 'Bank Name'},
    {field: monthlyTurnover, name: 'Monthly Turnover'},
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
      if (!field || (typeof field === 'string' && !field.trim())) {
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
            label="Business Vintage"
            placeholder="Enter Business vintage"
            value={businessVintage}
            onChangeText={value => setData('businessVintage', value)}
          />
          <CustomDropdown
            label="Sector"
            data={listOfSectors}
            value={sector}
            onChange={value => setData('sector', value)}
          />
          <CustomDropdown
            label="Bank Name"
            data={listOfBanks}
            value={bankName}
            onChange={value => setData('bankName', value)}
          />
          <Input
            label="Monthly Turnover"
            placeholder="Enter Monthly Turnover"
            value={formatIndianNumber(monthlyTurnover)}
            onChangeText={value => setData('monthlyTurnover', value)}
          />
          <Input
            label="CIBIL Score"
            placeholder="Enter CIBIL score"
            value={cibilScore}
            onChangeText={value => setData('cibilScore', value)}
          />
          <CustomDropdown
            label="Facility Type"
            data={listOfFacilityTypes}
            value={facilityType}
            onChange={value => setData('facilityType', value)}
          />
          <Input
            label="Existing Funding Sanctioned Amt"
            placeholder="Enter Funding Amount"
            value={formatIndianNumber(existingFundingSanctionedAmount)}
            onChangeText={value =>
              setData('existingFundingSanctionedAmount', value)
            }
          />
          <Input
            label="Estimated Funding Required"
            placeholder="Enter funding required"
            value={formatIndianNumber(estimatedFundingRequired)}
            onChangeText={value => setData('estimatedFundingRequired', value)}
          />
          <CustomDropdown
            label="Credit Period Offer (In Days)"
            data={listOfCreditPeriodOffer}
            value={creditPeriodOffer}
            dropdownPosition="top"
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
