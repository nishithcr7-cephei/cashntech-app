import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useMemo, useRef} from 'react';
import {
  AppBar,
  Container,
  
  CustomDropdown,
  DateNTimePicker,
  FooterButton,
  Input,
} from '@components/index';
import {LeftChevronCircle} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import Cities from '@constants/Cities';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';
import {BasicDetailsType, clientActions, clientSelector} from '@store/client';
import Toast from 'react-native-toast-message';
import {userSelector} from '@store/user';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {DrawerScreenProps} from 'node_modules/@react-navigation/drawer/lib/typescript/module/src/types';
import {CompositeScreenProps} from '@react-navigation/native';
import {ClientScreens} from '@constants/Screens';
import {LeadSourceType, ProductType, ProgramType} from './ClientInfo.type';

// Static Data
const listOfLeadSources = Object.values(LeadSourceType).map(item => {
  return {label: item, value: item};
});

const listOfStates = Object.keys(Cities).map(key => {
  return {label: key, value: key};
});

const listOfProgram = Object.values(ProgramType).map(item => {
  return {label: item, value: item};
});

const listOfProduct = Object.values(ProductType).map(item => {
  return {label: item, value: item};
});

type Props = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, 'BasicDetailForm'>,
  DrawerScreenProps<HomeNavigatorType>
>;

export const BasicDetailForm: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch();
  const isInitialLoad = useRef(true);
  const {
    sourceOfLead,
    firmName,
    location,
    state,
    city,
    dateOfVisit,
    address,
    productType,
    programType,
    pincode,
    salesmanId,
  } = useSelector(clientSelector.getBasicDetailFormData);

  const clientFormId = useSelector(clientSelector.getClientFormId);
  const clientLoader = useSelector(clientSelector.getClientLoader);
  const fullName = useSelector(userSelector.getFullName);
  const locationOptions = useSelector(clientSelector.getLocationOptions);
  const locationLoading = useSelector(clientSelector.getLocationLoading);
  const salesmanDropdown = useSelector(clientSelector.getSalesmanDropdown);
  const salesmanListLoading = useSelector(clientSelector.getSalesmanListLoading);
  
  // Debug logging for salesman dropdown
  console.log('BasicDetailForm: salesmanDropdown:', salesmanDropdown);
  console.log('BasicDetailForm: salesmanDropdown length:', salesmanDropdown.length);
  console.log('BasicDetailForm: salesmanListLoading:', salesmanListLoading);

  function setData<T extends keyof BasicDetailsType>(
    field: T,
    value: BasicDetailsType[T],
  ) {
    dispatch(clientActions.setBasicDetails({[field]: value}));
  }

  useEffect(() => {
    // Only clear city if we're not in edit mode (no clientFormId)
    if (!clientFormId) {
      setData('city', '');
    }
  }, [state, clientFormId]);

  useEffect(() => {
    // Fetch salesman list when component mounts
    dispatch(clientActions.fetchSalesmanList());
  }, [dispatch]);

  useEffect(() => {
    // Skip API call on initial load to avoid calling with potentially invalid pincode
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Fetch location options when pincode changes and is 6 digits
    if (pincode && pincode.length === 6) {
      dispatch(clientActions.fetchLocationOptions(pincode));
    } else if (pincode && pincode.length < 6) {
      // Clear location options if pincode is less than 6 digits
      dispatch(clientActions.clearLocationOptions());
      setData('location', '');
    }
  }, [pincode, dispatch]);

  const listOfCities = useMemo(() => {
    if (state) {
      return Cities[state] ?? [];
    }
    return [];
  }, [state]);

  const handleClear = () => {
    dispatch(clientActions.clearBasicDetails());
  };

  const handleSave = () => {
    if (!validateForm()) return;
    if (clientFormId) {
      dispatch(clientActions.updateClientBasicDetails());
      return;
    }
    dispatch(clientActions.saveClientBasicDetails());
  };

  const handleNext = () => {
    if (clientFormId) {
      navigation.navigate(ClientScreens.ClientDetailForm);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please save the form before proceeding to next step.',
      });
    }
  };

  const requiredFields = [
    {field: sourceOfLead, name: 'Source of Lead'},
    {field: programType, name: 'Type of Program'},
    {field: productType, name: 'Product Type'},
    {field: firmName, name: 'Firm Name'},
    {field: state, name: 'State'},
    {field: city, name: 'City'},
    {field: pincode, name: 'Pincode'},
    {field: dateOfVisit, name: 'Date of Visit'},
    {field: location, name: 'Location'},
    {field: address, name: 'Address'},
    {field: salesmanId, name: 'Filled By'},
  ];

  const validateForm = () => {
    for (let i = 0; i < requiredFields.length; i++) {
      const field = requiredFields[i].field;
      if (
        field === undefined ||
        field === null ||
        (typeof field === 'string' && !field.trim()) ||
        (typeof field === 'number' && field === 0)
      ) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `Please select ${requiredFields[i].name}`,
        });
        return false;
      }
    }
    return true;
  };

  return (
    <Container>
      <AppBar title="Client Information Master" navigation={navigation} />
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>Basic Details</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingScrollView style={{flexGrow: 1}}>
        <View style={styles.inputContainer}>
          <CustomDropdown
            label="Source of lead"
            data={listOfLeadSources}
            showSearch={false}
            onChange={value => setData('sourceOfLead', value)}
            value={sourceOfLead}
          />
          <CustomDropdown
            label="Type of Program"
            data={listOfProgram}
            onChange={value => setData('programType', value)}
            value={programType}
            showSearch={false}
          />
          <CustomDropdown
            label="Product Type"
            data={listOfProduct}
            onChange={value => setData('productType', value)}
            value={productType}
            showSearch={false}
          />
          <Input
            label="Firm Name"
            placeholder="Enter Firm Name"
            value={firmName}
            maxLength={50}
            onChangeText={value => setData('firmName', value)}
          />
          <CustomDropdown
            label="State"
            data={listOfStates}
            onChange={value => setData('state', value as keyof typeof Cities)}
            value={state}
          />
          <CustomDropdown
            label="City"
            data={listOfCities}
            onChange={value => setData('city', value)}
            value={city}
          />
           <Input
            label="Pincode"
            placeholder="Enter Pincode"
            value={pincode}
            maxLength={6}
            keyboardType="numeric"
            onChangeText={value => setData('pincode', value)}
          />
          <DateNTimePicker
            label="Date of visit"
            placeholder="Enter Date of Visit"
            value={dateOfVisit ? moment(dateOfVisit).format('DD/MM/YYYY') : ''}
            onConfirm={date => setData('dateOfVisit', date.toISOString())}
            mode="date"
          />
          <CustomDropdown
            label="Location"
            data={locationOptions}
            onChange={value => setData('location', value)}
            value={location}
            showSearch={false}
            placeholder={locationLoading ? "Loading..." : "Select Location"}
          />
          <Input
            label="Address"
            placeholder="Enter Address"
            value={address}
             maxLength={100}
            onChangeText={value => setData('address', value)}
          />
          <CustomDropdown
            label="Fill By"
            data={salesmanDropdown}
            onChange={value => setData('salesmanId', parseInt(value))}
            value={salesmanId ? salesmanId.toString() : ''}
            showSearch={false}
            placeholder={salesmanListLoading ? "Loading..." : "Select Salesman"}
            editable={!clientFormId} // Read-only in edit mode, editable in fresh mode
            dropdownPosition="top"
          />
        </View>
      </KeyboardAvoidingScrollView>
      <FooterButton
        onPressClearAll={handleClear}
        onPressSave={handleSave}
        onPressNext={handleNext}
      />
      <Modal transparent visible={clientLoader}>
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
