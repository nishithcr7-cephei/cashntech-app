/* eslint-disable @typescript-eslint/no-unused-vars */
import {LeftChevronCircle, Plus, RightCheckmark} from '@assets/Icons';
import {RightChevronCircle} from '@assets/Icons/RightChevronCircle';
import {
  AppBar,
  Container,
  CustomDropdown,
  DateNTimePicker,
  Input,
} from '@components/index';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {
  CreateClientFormProps,
  DataFieldsType,
  dropDownData,
  FieldType,
  formInputDetails,
  formNames,
  formTitles,
  FormTypes,
  productCategoryDropdown,
  BasicDetailsNames,
} from './CreateClientForm.type';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector} from '@store/client';
import {ClientFormType} from '@store/client/client.types';
import {Api} from '@services/api';
import {encryptSingleValueUtility, decryptLocation, decryptConditionally} from '@utils/crypto';
import {API_URL, RK_ENCRYPTION_KEY, RK_ENCRYPTION_IV} from '@config/config';
import {
  validateClientForm,
  ENABLE_FORM_VALIDATION,
} from './clientFormValidation';
import {getUserFullName} from '@utils/Utils';
import Endpoints from '@constants/ApiEndPoints';
import Toast from 'react-native-toast-message';
import Cities from '@constants/Cities';
import {getStorage} from '@services/localStorage';

const stateKeyToLabel: {[key: string]: string} = {
  Maharashtra: 'Maharashtra',
  Madhya_Pradesh: 'Madhya Pradesh',
  Gujarat: 'Gujarat',
  Karnataka: 'Karnataka',
  TamilNadu: 'Tamil Nadu',
  Telangana: 'Telangana',
  Andhra_Pradesh: 'Andhra Pradesh',
  Kerala: 'Kerala',
};

const stateList = Object.keys(Cities).map(key => ({
  label: (stateKeyToLabel as any)[key] || key,
  value: key,
}));

const CurrentForm = ({
  currentFormKey,
  bankList,
}: {
  currentFormKey: FormTypes;
  bankList?: {label: string; value: string}[];
}) => {
  const formData: ClientFormType = useSelector(
    clientSelector.getClientFormData,
  );
  const dispatch = useDispatch();
  let inputDetails = [...formInputDetails[currentFormKey]];

  const [selectedState, setSelectedState] = React.useState(
    formData.BasicDetails?.state || '',
  );
  const [selectedCity, setSelectedCity] = React.useState(
    formData.BasicDetails?.city || '',
  );

  const handleStateChange = (stateValue: string) => {
    setSelectedState(stateValue);
    setSelectedCity('');
    dispatch(
      clientActions.setClientFormData({
        formName: 'BasicDetails',
        name: 'state',
        value: stateValue,
      }),
    );
    dispatch(
      clientActions.setClientFormData({
        formName: 'BasicDetails',
        name: 'city',
        value: '',
      }),
    );
  };

  const handleCityChange = (cityValue: string) => {
    setSelectedCity(cityValue);
    dispatch(
      clientActions.setClientFormData({
        formName: 'BasicDetails',
        name: 'city',
        value: cityValue,
      }),
    );
  };

  let filteredInputDetails = inputDetails;
  if (currentFormKey === 'BasicDetails') {
    filteredInputDetails = inputDetails.filter(item => item.name !== 'pincode');
  }

  if (currentFormKey === 'VisitScreen') {
    const userResponse = formData.VisitScreen?.UserResponse;

    if (userResponse === 'Interested') {
      filteredInputDetails = filteredInputDetails.filter(
        item =>
          item.name === 'intent' ||
          item.name === 'nextVisitDate' ||
          item.name === 'UserResponse',
      );
    } else if (userResponse === 'Not interested') {
      filteredInputDetails = filteredInputDetails.filter(
        item =>
          item.name === 'reason' ||
          item.name === 'interested' ||
          item.name === 'UserResponse',
      );
    } else {
      filteredInputDetails = filteredInputDetails.filter(
        item => item.name === 'UserResponse',
      );
    }
  }

  return filteredInputDetails.map((item, index) => {
    if (
      currentFormKey === 'ClientFirmScreen' &&
      item.name === 'bankName' &&
      item.type === FieldType.INPUT &&
      bankList
    ) {
      const selectedBanks = formData.ClientFirmScreen.bankName || [];
      const availableBanks = bankList.filter(
        b => !selectedBanks.includes(b.value),
      );
      return (
        <View key={index} style={{marginBottom: 16}}>
          <Text style={{marginBottom: 8, fontWeight: 'bold'}}>
            {item.label}
          </Text>
          <View
            style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8}}>
            {selectedBanks.map(bank => (
              <View
                key={bank}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#e0e0e0',
                  borderRadius: 16,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginRight: 8,
                  marginBottom: 8,
                }}>
                <Text>{bank}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const updated = selectedBanks.filter(b => b !== bank);
                    dispatch(
                      clientActions.setClientFormData({
                        formName: 'ClientFirmScreen',
                        name: 'bankName',
                        value: updated,
                      }),
                    );
                  }}>
                  <Text style={{color: 'red', marginLeft: 6}}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <CustomDropdown
            label="Select Bank"
            data={availableBanks}
            value={''}
            onChange={val => {
              if (!selectedBanks.includes(val)) {
                const updated = [...selectedBanks, val];
                dispatch(
                  clientActions.setClientFormData({
                    formName: 'ClientFirmScreen',
                    name: 'bankName',
                    value: updated,
                  }),
                );
              }
            }}
          />
        </View>
      );
    }

    return (
      <FormInput
        key={index}
        item={item}
        value={formData[currentFormKey][item.name]}
        onUpdate={
          item.name === 'state'
            ? handleStateChange
            : item.name === 'city'
            ? handleCityChange
            : value => {
                if (currentFormKey === 'BasicDetails') {
                  dispatch(
                    clientActions.setClientFormData({
                      formName: 'BasicDetails',
                      name: item.name as import('./CreateClientForm.type').BasicDetailsNames,
                      value,
                    }),
                  );
                } else if (currentFormKey === 'ClientFirmScreen') {
                  dispatch(
                    clientActions.setClientFormData({
                      formName: 'ClientFirmScreen',
                      name: item.name as import('./CreateClientForm.type').ClientFirmNames,
                      value,
                    }),
                  );
                } else if (currentFormKey === 'VendorScreen') {
                  dispatch(
                    clientActions.setClientFormData({
                      formName: 'VendorScreen',
                      name: item.name as import('./CreateClientForm.type').VendorNames,
                      value,
                    }),
                  );
                } else if (currentFormKey === 'VisitScreen') {
                  dispatch(
                    clientActions.setClientFormData({
                      formName: 'VisitScreen',
                      name: item.name as import('./CreateClientForm.type').VisitNames,
                      value,
                    }),
                  );
                }
              }
        }
        selectedState={selectedState}
      />
    );
  });
};

function formatINR(value: string | number): string {
  if (!value) return '';
  const num = Number(value.toString().replace(/,/g, ''));
  if (isNaN(num)) return value.toString();
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const FormInput = ({
  item,
  value,
  onUpdate,
  selectedState,
}: {
  item: DataFieldsType;
  value: string;
  onUpdate: (value: string) => void;
  selectedState?: string;
}) => {
  if (item.type === FieldType.INPUT) {
    const isFinancialField =
      item.name === 'existingFunding' ||
      item.name === 'estimatedFunding' ||
      item.name === 'monthlySales';
    return (
      <Input
        label={item.label}
        placeholder="Value"
        value={isFinancialField ? formatINR(value) : value}
        onChangeText={text => {
          onUpdate(isFinancialField ? text.replace(/,/g, '') : text);
        }}
        keyboardType={
          item.name === 'visitNumber' ||
          item.name === 'businessVintage' ||
          item.name === 'cibilScore' ||
          item.name === 'existingFunding' ||
          item.name === 'estimatedFunding' ||
          item.name === 'monthlySales' ||
          item.name === 'pincode'
            ? 'numeric'
            : item.name === 'contactNumber' || item.name === 'vendorContact'
            ? 'phone-pad'
            : item.name === 'vendorEmail'
            ? 'email-address'
            : 'default'
        }
        maxLength={item.name === 'pincode' ? 6 : undefined}
      />
    );
  }
  if (item.type === FieldType.DROPDOWN) {
    if (item.name === 'state') {
      return (
        <CustomDropdown
          label={item.label}
          data={stateList}
          value={value}
          onChange={onUpdate}
        />
      );
    }
    if (item.name === 'city') {
      return (
        <CustomDropdown
          label={item.label}
          data={selectedState ? (Cities as any)[selectedState] || [] : []}
          value={value}
          onChange={onUpdate}
        />
      );
    }
    return (
      <CustomDropdown
        label={item.label}
        data={dropDownData[item.name]}
        value={value}
        onChange={onUpdate}
      />
    );
  }
  if (item.type === FieldType.DATE) {
    const isNextVisitDate = item.name === 'nextVisitDate';
    return (
      <DateNTimePicker
        label={item.label}
        onConfirm={date => {
          onUpdate(date.toISOString());
        }}
        value={value ? new Date(value).toDateString() : ''}
        placeholder="Select Date"
        datePickerProps={{
          date: value ? new Date(value) : new Date(),
          mode: 'date',
          ...(isNextVisitDate ? {minimumDate: new Date()} : {}),
        }}
      />
    );
  }
  return null;
};

export const CreateClientForm: React.FC<CreateClientFormProps> = ({
  navigation,
  route: {params},
}) => {
  const dispatch = useDispatch();
  const [formIndex, setFormIndex] = React.useState(() =>
    formNames.indexOf(params.screen),
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPageLoading, setIsPageLoading] = React.useState(false);
  const currentFormKey: FormTypes = formNames[formIndex];
  const currentTitle = formTitles[currentFormKey];
  const formData: ClientFormType = useSelector(
    clientSelector.getClientFormData,
  );

  const [vendorList, setVendorList] = React.useState([
    {
      product_category: '',
      product_type: '',
      vendor_name: '',
      address: '',
      city: '',
      state: '',
      pin_code: '',
      vendor_contact_number: '',
      vendor_contact_email: '',
      monthly_sales_value: '',
      created_by: getUserFullName(),
    },
  ]);

  const clientFormId = useSelector(clientSelector.getClientFormId);

  const [selectedState, setSelectedState] = React.useState(
    formData.BasicDetails?.state || '',
  );
  const [selectedCity, setSelectedCity] = React.useState(
    formData.BasicDetails?.city || '',
  );

  const handleStateChange = (stateValue: string) => {
    setSelectedState(stateValue);
    setSelectedCity('');
    dispatch(
      clientActions.setClientFormData({
        formName: 'BasicDetails',
        name: 'state',
        value: stateValue,
      }),
    );
    dispatch(
      clientActions.setClientFormData({
        formName: 'BasicDetails',
        name: 'city',
        value: '',
      }),
    );
  };

  const handleCityChange = (cityValue: string) => {
    setSelectedCity(cityValue);
    dispatch(
      clientActions.setClientFormData({
        formName: 'BasicDetails',
        name: 'city',
        value: cityValue,
      }),
    );
  };

  const onPressSave = async () => {
    const currentForm = formNames[formIndex];
    if (ENABLE_FORM_VALIDATION) {
      const validation = validateClientForm(
        currentFormKey,
        formData[currentFormKey],
      );
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: firstError,
        });
        return;
      }
    }
    setIsLoading(true);
    if (currentForm === 'BasicDetails') {
      const url = `${API_URL}/client-info-master/basic-details`;
      if (params?.isEdit && params?.clientId) {
        const {typeOfVisit, visitNumber, ...rest} = formData.BasicDetails;
        const payload = {
          ...rest,
          location: encryptSingleValueUtility(
            rest.location,
            RK_ENCRYPTION_KEY,
            RK_ENCRYPTION_IV,
          ),
          city: rest.city,
          state: rest.state,
          type_of_visit: typeOfVisit,
          visit: Number(visitNumber),
          clientId: params.clientId,
          date_of_visit: rest.dateOfVisit
            ? new Date(rest.dateOfVisit).toISOString()
            : undefined,
        };
        
        // Show API Debug Alert for Basic Details Edit
        // Alert.alert(
        //   'Basic Details API Debug (EDIT)',
        //   `URL: ${url}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`,
        //   [
        //     {
        //       text: 'OK',
        //       onPress: async () => {
                try {
                  await dispatch(
                    clientActions.saveClientBasicDetails({clientId: params.clientId}),
                  );
                  // Alert.alert(
                  //   'Basic Details API Response',
                  //   'SUCCESS: Basic Details Saved Successfully',
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'success',
                    text1: 'Basic Details Saved Successfully',
                  });
                  if (formIndex < formNames.length - 1) {
                    setFormIndex(prev => prev + 1);
                  }
                } catch (error) {
                  // Alert.alert(
                  //   'Basic Details API Response',
                  //   `ERROR: ${error}`,
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'error',
                    text1: 'Failed to save basic details',
                  });
                  setIsLoading(false);
                  return;
                }
        //       }
        //     }
        //   ]
        // );
      } else {
        const payload = {
          ...formData.BasicDetails,
          location: encryptSingleValueUtility(
            formData.BasicDetails.location,
            RK_ENCRYPTION_KEY,
            RK_ENCRYPTION_IV,
          ),
          city: formData.BasicDetails.city,
          state: formData.BasicDetails.state,
          date_of_visit: formData.BasicDetails.dateOfVisit
            ? new Date(formData.BasicDetails.dateOfVisit).toISOString()
            : undefined,
        };
        
        // Show API Debug Alert for Basic Details Create
        // Alert.alert(
        //   'Basic Details API Debug (CREATE)',
        //   `URL: ${url}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`,
        //   [
        //     {
        //       text: 'OK',
        //       onPress: async () => {
                try {
                  await dispatch(clientActions.saveClientBasicDetails());
                  // Alert.alert(
                  //   'Basic Details API Response',
                  //   'SUCCESS: Basic Details Saved Successfully',
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'success',
                    text1: 'Basic Details Saved Successfully',
                  });
                  if (formIndex < formNames.length - 1) {
                    setFormIndex(prev => prev + 1);
                  }
                } catch (error) {
                  // Alert.alert(
                  //   'Basic Details API Response',
                  //   `ERROR: ${error}`,
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'error',
                    text1: 'Failed to save basic details',
                  });
                  setIsLoading(false);
                  return;
                }
        //       }
        //     }
        //   ]
        // );
      }
    } else if (currentForm === 'ClientFirmScreen') {
      const payload = {
        ...formData.ClientFirmScreen,
        bank_name: (formData.ClientFirmScreen.bankName || []).join(','),
      };
      
      // Show API Debug Alert for Client Firm Details
      // Alert.alert(
      //   'Client Firm API Debug',
      //   `Payload:\n${JSON.stringify(payload, null, 2)}`,
      //   [
      //     {
      //       text: 'OK',
      //       onPress: async () => {
                try {
                  await dispatch(clientActions.saveClientFirmDetails());
                  // Alert.alert(
                  //   'Client Firm API Response',
                  //   'SUCCESS: Client Firm Details Saved Successfully',
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'success',
                    text1: 'Client Firm Details Saved Successfully',
                  });
                  if (formIndex < formNames.length - 1) {
                    setFormIndex(prev => prev + 1);
                  }
                } catch (error) {
                  // Alert.alert(
                  //   'Client Firm API Response',
                  //   `ERROR: ${error}`,
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'error',
                    text1: 'Failed to save client firm details',
                  });
                  setIsLoading(false);
                  return;
                }
      //       }
      //     }
      //   ]
      // );
    } else if (currentForm === 'VendorScreen') {
      const clientId = params?.clientId || clientFormId;
      const vendorListWithCreatedBy = vendorList.map(vendor => ({
        ...vendor,
        created_by: getUserFullName(),
      }));
      const url = Endpoints.apiSaveVendorDetails(String(clientId));
      const fullUrl = `${API_URL}${url}`;
      
      // Show API Debug Alert for Vendor Details
      // Alert.alert(
      //   'Vendor Details API Debug',
      //   `URL: ${fullUrl}\n\nPayload:\n${JSON.stringify(vendorListWithCreatedBy, null, 2)}`,
      //   [
      //     {
      //       text: 'OK',
      //       onPress: async () => {
                try {
                  const response = await Api.post(url, vendorListWithCreatedBy);
                  if (response?.status === 201 && response?.data?.message) {
                    // Alert.alert(
                    //   'Vendor Details API Response',
                    //   `SUCCESS: ${JSON.stringify(response.data, null, 2)}`,
                    //   [{text: 'OK'}]
                    // );
                    Toast.show({
                      type: 'success',
                      text1: response.data.message,
                    });
                    if (formIndex < formNames.length - 1) {
                      setFormIndex(prev => prev + 1);
                    }
                  } else {
                    // Alert.alert(
                    //   'Vendor Details API Response',
                    //   `UNEXPECTED RESPONSE: ${JSON.stringify(response, null, 2)}`,
                    //   [{text: 'OK'}]
                    // );
                    Toast.show({
                      type: 'error',
                      text1: 'Failed to save vendors.',
                    });
                  }
                } catch (error) {
                  // Alert.alert(
                  //   'Vendor Details API Response',
                  //   `ERROR: ${error}`,
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'error',
                    text1: 'Failed to save vendors.',
                  });
                }
                setIsLoading(false);
                return;
      //       }
      //     }
      //   ]
      // );
    } else if (currentForm === 'VisitScreen') {
      const payload = formData.VisitScreen;
      
      // Show API Debug Alert for Visit Details
      // Alert.alert(
      //   'Visit Details API Debug',
      //   `Payload:\n${JSON.stringify(payload, null, 2)}`,
      //   [
      //     {
      //       text: 'OK',
      //       onPress: async () => {
                try {
                  await dispatch(clientActions.saveVisitDetails());
                  // Alert.alert(
                  //   'Visit Details API Response',
                  //   'SUCCESS: Visit Details Saved Successfully',
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'success',
                    text1: 'Visit Details Saved Successfully',
                  });
                  if (formIndex < formNames.length - 1) {
                    setFormIndex(prev => prev + 1);
                  }
                } catch (error) {
                  // Alert.alert(
                  //   'Visit Details API Response',
                  //   `ERROR: ${error}`,
                  //   [{text: 'OK'}]
                  // );
                  Toast.show({
                    type: 'error',
                    text1: 'Failed to save visit details',
                  });
                  setIsLoading(false);
                  return;
                }
      //       }
      //     }
      //   ]
      // );
    }
    setIsLoading(false);
  };

  const isFormFilled = (formSection: any) => {
    return Object.values(formSection).some(v =>
      typeof v === 'string'
        ? v.trim() !== ''
        : v !== '' && v !== undefined && v !== null,
    );
  };

  const onPressNext = () => {
    const currentForm = formNames[formIndex];
    let isFilled = false;
    if (currentForm === 'BasicDetails') {
      isFilled = isFormFilled(formData.BasicDetails);
    } else if (currentForm === 'ClientFirmScreen') {
      isFilled = isFormFilled(formData.ClientFirmScreen);
    } else if (currentForm === 'VendorScreen') {
      isFilled = vendorList.some(vendor =>
        Object.values(vendor).some(v =>
          typeof v === 'string'
            ? v.trim() !== ''
            : v !== '' && v !== undefined && v !== null,
        ),
      );
    } else if (currentForm === 'VisitScreen') {
      isFilled = isFormFilled(formData.VisitScreen);
    }
    if (isFilled) {
      Toast.show({
        type: 'info',
        text1: 'Please press Save before proceeding to the next step.',
      });
      return;
    }
    if (formIndex < formNames.length - 1) {
      setFormIndex(prev => prev + 1);
    }
  };

  const onPressClearAll = () => {
    dispatch(clientActions.resetClientFormData(currentFormKey));
  };

  React.useEffect(() => {
    if (currentFormKey === 'BasicDetails' && !formData.BasicDetails?.Fillby) {
      const email = getStorage('user_email') || 'Test User';
      dispatch(
        clientActions.setClientFormData({
          formName: 'BasicDetails',
          name: 'Fillby',
          value: email,
        } as {formName: 'BasicDetails'; name: BasicDetailsNames; value: string}),
      );
    }
  }, [currentFormKey, formData.BasicDetails?.Fillby, dispatch]);

  React.useEffect(() => {
    const fetchBasicDetails = async () => {
      if (
        params?.isEdit &&
        params?.clientId &&
        currentFormKey === 'BasicDetails'
      ) {
        try {
          setIsPageLoading(true);
          const url = `client-info-master/basic/${params.clientId}`;
          const fullUrl = `${API_URL}${url}`;
          const response = await Api.get(url);
          if (response.data && response.data.statusCode === 200) {
            const data = response.data.data;
            dispatch(
              clientActions.setClientFormData({
                formName: 'BasicDetails',
                name: 'sourceOfLead',
                value: data.source_of_lead || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'BasicDetails',
                name: 'location',
                value: decryptConditionally(data.location || ''),
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'BasicDetails',
                name: 'city',
                value: data.city || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'BasicDetails',
                name: 'state',
                value: data.state || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'BasicDetails',
                name: 'dateOfVisit',
                value: (data.date_of_visit || '').slice(0, 10),
              }),
            );
          }
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Failed to load basic details',
          });
        } finally {
          setIsPageLoading(false);
        }
      }
    };

    const fetchClientFirmDetails = async () => {
      if (
        params?.isEdit &&
        params?.clientId &&
        currentFormKey === 'ClientFirmScreen'
      ) {
        try {
          setIsPageLoading(true);
          const url = `client-info-master/client-firm/${params.clientId}`;
          const response = await Api.get(url);
          if (response.data && response.data.statusCode === 200) {
            const data = response.data.data;
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'clientName' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.client_name || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'firmName' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.firm_name || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'contactNumber' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.contact_number || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'typeOfFirm' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.firm_type || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'businessVintage' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.business_vintage?.toString() || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'sector' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.sector || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'bankName' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.bank_name || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'cibilScore' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.cibil_score?.toString() || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'facilityType' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.facility_type || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'existingFunding' as import('./CreateClientForm.type').ClientFirmNames,
                value:
                  data.existing_funding_sanctioned_amount?.toString() || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'estimatedFunding' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.estimated_funding_required?.toString() || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'ClientFirmScreen',
                name: 'creditPeriod' as import('./CreateClientForm.type').ClientFirmNames,
                value: data.credit_period_offer?.toString() || '',
              }),
            );
          }
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Failed to load client firm details',
          });
        } finally {
          setIsPageLoading(false);
        }
      }
    };

    const fetchVendorDetails = async () => {
      if (
        params?.isEdit &&
        params?.clientId &&
        currentFormKey === 'VendorScreen'
      ) {
        try {
          setIsPageLoading(true);
          const url = `client-info-master/vendor/${params.clientId}`;
          const response = await Api.get(url);
          if (
            response.data &&
            response.data.statusCode === 200 &&
            Array.isArray(response.data.data) &&
            response.data.data.length > 0
          ) {
            const data = response.data.data[0];
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'Product',
                value: data.product_category || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'vendorName',
                value: data.vendor_name || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'address',
                value: data.vendor_address || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'city',
                value: data.vendor_city || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'state',
                value: data.vendor_state || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'pincode',
                value: data.vendor_pin_code || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'vendorContact',
                value: data.vendor_contact_number || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'vendorEmail',
                value: data.vendor_contact_email || '',
              }),
            );
            dispatch(
              clientActions.setClientFormData({
                formName: 'VendorScreen',
                name: 'monthlySales',
                value: data.monthly_sales_value?.toString() || '',
              }),
            );
          }
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Failed to load vendor details',
          });
        } finally {
          setIsPageLoading(false);
        }
      }
    };

    fetchBasicDetails();
    fetchClientFirmDetails();
    fetchVendorDetails();
  }, [params?.isEdit, params?.clientId, currentFormKey]);

  const [bankList, setBankList] = React.useState<
    {label: string; value: string}[]
  >([]);
  React.useEffect(() => {
    if (currentFormKey === 'ClientFirmScreen') {
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
    }
  }, [currentFormKey]);

  return (
    <Container>
      <AppBar title="Client Information Master" navigation={navigation} />
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>{currentTitle}</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Overlay for API calls */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        </View>
      )}

      {/* Page Loading Overlay for initial data fetch */}
      {isPageLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}
      <ScrollView>
        <View style={styles.inputContainer}>
          {currentFormKey === 'VendorScreen' ? (
            <>
              {vendorList.map((vendor, index) => (
                <View key={index} style={{marginBottom: 16}}>
                  <Text style={{fontWeight: fontWeight.Bold, marginBottom: 8}}>
                    Vendor {index + 1}
                  </Text>
                  {/* Render each input field for this vendor */}
                  {/* Product Category Dropdown */}
                  <CustomDropdown
                    label="Product Category"
                    data={productCategoryDropdown}
                    value={vendor.product_category}
                    onChange={text => {
                      const newList = [...vendorList];
                      newList[index].product_category = text;
                      setVendorList(newList);
                    }}
                  />
                  <Input
                    label="Product Type"
                    placeholder="Product Type"
                    value={vendor.product_type}
                    onChangeText={text => {
                      const newList = [...vendorList];
                      newList[index].product_type = text;
                      setVendorList(newList);
                    }}
                  />
                  <Input
                    label="Vendor Name"
                    placeholder="Vendor Name"
                    value={vendor.vendor_name}
                    onChangeText={text => {
                      const newList = [...vendorList];
                      newList[index].vendor_name = text;
                      setVendorList(newList);
                    }}
                  />
                  <Input
                    label="Address"
                    placeholder="Address"
                    value={vendor.address}
                    onChangeText={text => {
                      const newList = [...vendorList];
                      newList[index].address = text;
                      setVendorList(newList);
                    }}
                  />
                  {/* State Dropdown (moved above City) */}
                  <CustomDropdown
                    label="State"
                    data={stateList}
                    value={vendor.state}
                    onChange={text => {
                      const newList = [...vendorList];
                      newList[index].state = text;
                      setVendorList(newList);
                      setSelectedState(text);
                      setSelectedCity('');
                    }}
                  />
                  {/* City Dropdown */}
                  <CustomDropdown
                    label="City"
                    data={(Cities as any)[vendor.state] || []}
                    value={vendor.city}
                    onChange={text => {
                      const newList = [...vendorList];
                      newList[index].city = text;
                      setVendorList(newList);
                    }}
                  />
                  <Input
                    label="Pin Code"
                    placeholder="Pin Code"
                    value={vendor.pin_code}
                    onChangeText={text => {
                      const newList = [...vendorList];
                      newList[index].pin_code = text;
                      setVendorList(newList);
                    }}
                  />
                  <Input
                    label="Vendor Contact Number"
                    placeholder="Vendor Contact Number"
                    value={vendor.vendor_contact_number}
                    onChangeText={text => {
                      const newList = [...vendorList];
                      newList[index].vendor_contact_number = text;
                      setVendorList(newList);
                    }}
                  />
                  <Input
                    label="Monthly Sales Value"
                    placeholder="Monthly Sales Value"
                    value={vendor.monthly_sales_value}
                    onChangeText={text => {
                      const newList = [...vendorList];
                      newList[index].monthly_sales_value = text;
                      setVendorList(newList);
                    }}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={styles.vendorButton}
                onPress={() => {
                  setVendorList(prev => [
                    ...prev,
                    {
                      product_category: '',
                      product_type: '',
                      vendor_name: '',
                      address: '',
                      city: '',
                      state: '',
                      pin_code: '',
                      vendor_contact_number: '',
                      vendor_contact_email: '',
                      monthly_sales_value: '',
                      created_by: getUserFullName(),
                    },
                  ]);
                }}>
                <Text style={styles.vendorButtonText}>Add Vendor</Text>
                <Plus width={11} height={11} />
              </TouchableOpacity>
            </>
          ) : (
            <CurrentForm currentFormKey={currentFormKey} bankList={bankList} />
          )}
        </View>
      </ScrollView>
      <View style={styles.footerButton}>
        <TouchableOpacity style={styles.clearButton} onPress={onPressClearAll}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, {backgroundColor: Colors.white}]}
          activeOpacity={0.7}
          onPress={onPressSave}>
          <Text style={[styles.saveText, {color: Colors.green}]}>Save</Text>
        </TouchableOpacity>

        {formIndex === formNames.length - 1 ? (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              navigation.replace('ClientInfo');
            }}>
            <Text style={styles.saveText}>Submit</Text>
            <RightCheckmark width={12} height={12} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={onPressNext}>
            <Text style={styles.nextText}>Next</Text>
            <View style={styles.iconWrapper}>
              <RightChevronCircle width={24} height={24} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
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
    color: '#333',
  },
  inputContainer: {
    marginHorizontal: scaleWidth(24),
    marginTop: scaleHeight(17),
    gap: scaleHeight(20),
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  clearButton: {
    paddingHorizontal: 10,
  },
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextText: {
    color: Colors.blueGray700,
    fontSize: 16,
    marginStart: scaleWidth(10),
  },
  iconWrapper: {
    backgroundColor: '#EAEAEA',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleWidth(24),
    height: scaleWidth(24),
    marginHorizontal: scaleWidth(12),
  },
  vendorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.graybase,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    marginTop: scaleHeight(10),
    gap: 8,
  },
  vendorButtonText: {
    color: '#6E6E78',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.Medium,
    color: Colors.darkblack,
  },
});
