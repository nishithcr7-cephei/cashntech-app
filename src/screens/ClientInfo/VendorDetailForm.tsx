import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {use, useCallback, useEffect, useMemo} from 'react';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {LeftChevronCircle} from '@assets/Icons';
import {
  Container,
  AppBar,
  Input,
  CustomDropdown,
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

export enum ProductCategory {
  PERSONAL_CARE_HYGIENE = 'Personal Care & Hygiene',
  HOUSEHOLD_CLEANING = 'Household Cleaning',
  PACKAGED_FOODS = 'Packaged Foods',
  BEVERAGES = 'Beverages',
  DAIRY_FROZEN_FOODS = 'Dairy & Frozen Foods',
  CONFECTIONERY = 'Confectionery',
  STAPLE_GROCERY = 'Staple & Grocery',
  PAPER_DISPOSABLE = 'Paper & Disposable',
}

export const productTypeOptions: Record<ProductCategory, string[]> = {
  [ProductCategory.PERSONAL_CARE_HYGIENE]: [
    'Toothpaste',
    'Toothbrush',
    'Shampoo',
    'Conditioner',
    'Soap',
    'Body wash',
    'Face wash',
    'Face cream',
    'Deodorants',
    'Perfumes',
    'Shaving creams',
    'Razors',
    'Sanitary napkins',
    'Baby diapers',
  ],
  [ProductCategory.HOUSEHOLD_CLEANING]: [
    'Detergents (powder/liquid)',
    'Dishwashing bars/liquids',
    'Floor cleaners',
    'Toilet cleaners',
    'Air fresheners',
    'Mosquito repellents',
  ],
  [ProductCategory.PACKAGED_FOODS]: [
    'Biscuits',
    'Cookies',
    'Chips',
    'Namkeen',
    'Instant noodles',
    'Pasta',
    'Breakfast cereals',
    'Bakery items',
    'Ready-to-eat meals',
  ],
  [ProductCategory.BEVERAGES]: [
    'Packaged drinking water',
    'Soft drinks',
    'Juices',
    'Energy drinks',
    'Tea',
    'Coffee',
  ],
  [ProductCategory.DAIRY_FROZEN_FOODS]: [
    'Milk',
    'Butter',
    'Cheese',
    'Paneer',
    'Ice cream',
    'Frozen desserts',
    'Yogurt',
    'Curd',
    'Frozen snacks',
  ],
  [ProductCategory.CONFECTIONERY]: [
    'Chocolates',
    'Chewing gum',
    'Candies',
    'Toffees',
    'Lollipops',
  ],
  [ProductCategory.STAPLE_GROCERY]: [
    'Salt',
    'Sugar',
    'Edible oils',
    'Atta',
    'Rice',
    'Spices & masalas',
    'Pulses',
    'Lentils',
  ],
  [ProductCategory.PAPER_DISPOSABLE]: [
    'Tissues',
    'Napkins',
    'Toilet rolls',
    'Aluminum foil',
    'Cling film',
    'Disposable plates',
    'Cups',
  ],
};

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
}: {
  vendor: VendorDetailsType[number];
  index: number;
  setData: <T>(
    field: keyof VendorDetailsType[number],
    value: T,
    index: number,
  ) => void;
}) => {
  const dispatch = useDispatch();

  const listOfProductType = useMemo(() => {
    if (!vendor.productCategory || !productTypeOptions[vendor.productCategory])
      return [];
    return productTypeOptions[vendor.productCategory].map(item => ({
      label: item,
      value: item,
    }));
  }, [vendor.productCategory]);

  const listOfCities = useMemo(() => {
    if (!vendor.state) return [];
    return Cities[vendor.state] ?? [];
  }, [vendor.state]);

  useEffect(() => {
    setData('city', '', index);
  }, [vendor.state]);

  useEffect(() => {
    setData('productType', '', index);
  }, [vendor.productCategory]);

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
        <CustomDropdown
          label="Product Category"
          data={listOfProductCategories}
          value={vendor.productCategory}
          onChange={value => setData('productCategory', value, index)}
        />
        <CustomDropdown
          label="Product Type"
          data={listOfProductType}
          value={vendor.productType}
          onChange={value => setData('productType', value, index)}
        />
        <Input
          label="Vendor Name"
          placeholder="Enter Vendor Name"
          value={vendor.vendorName}
          onChangeText={value => setData('vendorName', value, index)}
        />
        <Input
          label="Address"
          placeholder="Enter Address"
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

        <Input
          label="Pincode"
          placeholder="Enter Pincode"
          value={vendor.pinCode}
          onChangeText={value => setData('pinCode', value, index)}
        />
        <Input
          label="Vendor Contact Number"
          placeholder="Enter Contact number"
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

    dispatch(clientActions.saveVendorDetails());
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
        !vendor.productCategory?.trim() ||
        !vendor.productType?.trim() ||
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
