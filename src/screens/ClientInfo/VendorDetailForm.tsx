import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo} from 'react';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {LeftChevronCircle} from '@assets/Icons';
import {
  Container,
  AppBar,
  Input,
  CustomDropdown,
  MultiSelectDropdown,
  FooterButton,
} from '@components/index';
import Cities from '@constants/Cities';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector, VendorDetailsType} from '@store/client';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType} from '@type/NavigatorTypes';
import Toast from 'react-native-toast-message';
import {ClientScreens} from '@constants/Screens';
import {formatIndianNumber} from '@utils/Utils';
import {ProductCategory, productTypeOptions} from './ClientInfo.type';

const listOfProductCategories = Object.values(ProductCategory).map(item => ({
  label: item,
  value: item,
}));

const listOfStates = Object.keys(Cities).map(key => {
  return {label: key, value: key};
});

type Props = NativeStackScreenProps<ClientNavigatorType, 'VendorDetailForm'>;

const VendorForm = ({
  vendor,
  index,
  setData,
  clientFormId,
}: {
  vendor: VendorDetailsType[number];
  index: number;
  setData: <T>(
    field: keyof VendorDetailsType[number],
    value: T,
    index: number,
  ) => void;
  clientFormId: number | undefined;
}) => {
  const dispatch = useDispatch();

  const listOfProductType = useMemo(() => {
    if (!vendor.productCategory || vendor.productCategory.length === 0) return [];
    
    // Combine product types from all selected categories
    const allProductTypes = new Set<string>();
    vendor.productCategory.forEach(category => {
      if (productTypeOptions[category as ProductCategory]) {
        productTypeOptions[category as ProductCategory].forEach(type => {
          allProductTypes.add(type);
        });
      }
    });
    
    return Array.from(allProductTypes).map(item => ({
      label: item,
      value: item,
    }));
  }, [vendor.productCategory]);

  const listOfCities = useMemo(() => {
    if (!vendor.state) return [];
    return Cities[vendor.state] ?? [];
  }, [vendor.state]);

  const postalCodeOptions = useSelector(clientSelector.getPostalCodeOptions);
  const postalCodeLoading = useSelector(clientSelector.getPostalCodeLoading);

  useEffect(() => {
    console.log('VendorDetailForm: Postal code options updated:', postalCodeOptions);
    console.log('VendorDetailForm: Postal code loading:', postalCodeLoading);
  }, [postalCodeOptions, postalCodeLoading]);

  useEffect(() => {
    // Only clear city and pincode if we're not in edit mode (no clientFormId)
    if (!clientFormId) {
      setData('city', '', index);
      setData('pinCode', '', index);
    }
  }, [vendor.state, clientFormId]);

  useEffect(() => {
    // Only clear product type if we're not in edit mode (no clientFormId)
    if (!clientFormId) {
      setData('productType', [], index);
    }
  }, [vendor.productCategory, clientFormId]);

  useEffect(() => {
    console.log('VendorDetailForm: City changed to:', vendor.city);
    if (vendor.city) {
      console.log('VendorDetailForm: Dispatching fetchPostalCodeOptions for:', vendor.city);
      dispatch(clientActions.fetchPostalCodeOptions(vendor.city));
    } else {
      console.log('VendorDetailForm: Clearing postal code options');
      dispatch(clientActions.clearPostalCodeOptions());
    }
  }, [vendor.city, dispatch]);

  const removeVendor = (id: string) => {
    dispatch(clientActions.removeVendorDetails(id));
  };

  return (
    <View key={vendor.key} style={{marginBottom: 20}}>
      <View style={styles.inputContainer}>
        <View style={styles.clientHeader}>
          <Text style={styles.formTitle}>Vendor {index + 1}</Text>
          {index != 0 && (
            <TouchableOpacity
              style={styles.trashButton}
              onPress={() => removeVendor(vendor.key)}>
              <FontAwesome6
                name="trash"
                iconStyle="solid"
                size={14}
                color={'rgb(112,112,112'}
              />
            </TouchableOpacity>
          )}
        </View>
        <MultiSelectDropdown
          label="Product Category"
          data={listOfProductCategories}
          value={vendor.productCategory}
          onChange={value => setData('productCategory', value, index)}
          placeholder="Select multiple product categories"
        />
        <MultiSelectDropdown
          label="Product Type"
          data={listOfProductType}
          value={vendor.productType}
          onChange={value => setData('productType', value, index)}
          placeholder="Select multiple product types"
        />
        <Input
          label="Vendor Name"
          placeholder="Enter Vendor Name"
          maxLength={50}
          value={vendor.vendorName}
          onChangeText={value => setData('vendorName', value, index)}
        />
        <Input
          label="Address"
          placeholder="Enter Address"
          maxLength={100}
          value={vendor.address}
          onChangeText={value => setData('address', value, index)}
        />
        <CustomDropdown
          label="State"
          placeholder="Select State"
          data={listOfStates}
          value={vendor.state}
          onChange={value => setData('state', value, index)}
        />
        <CustomDropdown
          label="City"
          placeholder="Select City"
          data={listOfCities}
          value={vendor.city}
          onChange={value => setData('city', value, index)}
        />

        <CustomDropdown
          label="Pincode"
          placeholder={postalCodeLoading ? "Loading..." : "Select Pincode"}
          data={postalCodeOptions}
          value={vendor.pinCode}
          onChange={value => setData('pinCode', value, index)}
          showSearch={true}
        />
        <Input
          label="Vendor Contact Number"
          placeholder="Enter Contact number"
          keyboardType="phone-pad"
          maxLength={10}
          value={vendor.vendorContactNumber}
          onChangeText={value => setData('vendorContactNumber', value, index)}
        />
        <Input
          label="Monthly Sales Value"
          placeholder="Enter Monthly sales value"
          value={formatIndianNumber(vendor.monthlySalesValue.toString())}
          keyboardType="numeric"
          onChangeText={value =>
            setData('monthlySalesValue', value.replace(/,/g, ''), index)
          }
        />
      </View>
    </View>
  );
};

export const VendorDetailForm: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch();
  const vendorLoader = useSelector(clientSelector.getClientLoader);
  const vendorDetails = useSelector(clientSelector.getVendorDetailsFormData);
  const isSavedVendorDetails = useSelector(
    clientSelector.getVendorDetailsFormStatus,
  );
  const clientFormId = useSelector(clientSelector.getClientFormId);
  const setData = useCallback(
    <T,>(field: keyof VendorDetailsType[number], value: T, index: number) => {
      dispatch(clientActions.setVendorDetails([{[field]: value}, index]));
    },
    [dispatch],
  );
  const handleAddVendor = () => {
    dispatch(clientActions.addNewVendorDetails());
  };

  const handleClear = () => {
    dispatch(clientActions.clearVendorDetails());
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (clientFormId) {
      dispatch(clientActions.saveVendorDetails()); // Update existing vendor details
    } else {
      dispatch(clientActions.saveVendorDetails()); // Save new vendor details
    }
  };

  const handleNext = () => {
    if (isSavedVendorDetails) {
      navigation.navigate(ClientScreens.VisitDetailForm);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please save the form before proceeding to next step.',
      });
    }
  };

  const validateForm = () => {
    for (let i = 0; i < vendorDetails.length; i++) {
      const vendor = vendorDetails[i];
      if (
        !vendor.productCategory || vendor.productCategory.length === 0 ||
        !vendor.productType || vendor.productType.length === 0 ||
        !vendor.vendorName?.trim() ||
        !vendor.address?.trim() ||
        !vendor.state?.trim() ||
        !vendor.city?.trim() ||
        !vendor.pinCode?.trim() ||
        !vendor.vendorContactNumber?.trim() ||
        !vendor.monthlySalesValue?.trim()
      ) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `Please fill all the fields for Vendor ${i + 1}`,
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
          <Text style={styles.subheader}>Vendor Details</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingScrollView style={{flexGrow: 1}}>
        {vendorDetails.map((vendor, index) => (
          <VendorForm
            key={vendor.key}
            vendor={vendor}
            index={index}
            setData={setData}
            clientFormId={clientFormId}
          />
        ))}
        <TouchableOpacity style={styles.addButton} onPress={handleAddVendor}>
          <Text style={styles.addButtonText}>Add Vendor +</Text>
        </TouchableOpacity>
      </KeyboardAvoidingScrollView>
      <FooterButton
        onPressClearAll={handleClear}
        onPressSave={handleSave}
        onPressNext={handleNext}
        showNext={true}
      />
      <Modal transparent visible={vendorLoader}>
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
  formTitle: {
    fontSize: scaleFont(15),
    fontWeight: fontWeight.Medium,
    color: Colors.darkblack,
    marginBottom: 8,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2.5,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(8),
    marginHorizontal: scaleHeight(24),
    paddingVertical: scaleHeight(8),
    alignSelf: 'flex-start',
    marginTop: scaleHeight(17),
    minWidth: scaleWidth(110),
  },
  addButtonText: {
    fontSize: scaleFont(14),
    color: '#7A7A7A',
    fontWeight: fontWeight.Medium,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  trashButton: {
    padding: scaleWidth(6),
    borderRadius: scaleWidth(24),
    borderColor: 'rgb(112,112,112)',
    borderWidth: 1,
    height: scaleWidth(32),
    width: scaleWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
