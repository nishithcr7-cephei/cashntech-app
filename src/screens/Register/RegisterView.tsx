import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import {
  AppBar,
  Container,
  CustomDropdown,
  FooterButton,
  Input,
  DashedButton,
  UploadModal,
} from '@components/index';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {KeyboardAwareScrollView} from '@components/index';
import Cities from '@constants/Cities';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {SectorType} from '@type/common.types';
import Toast from 'react-native-toast-message';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {AuthScreens} from '@constants/Screens';
import {
  setRegisterFormData,
  setCaptchaImage,
  submitRegisterForm,
  resetRegisterForm,
  selectRegisterFormData,
  selectRegisterLoading,
  selectRegisterError,
  selectRegisterSuccess,
  selectRegisterServerResponse,
  selectCaptchaImage,
  RegisterFormData,
} from '@store/registerweb';

// Static Data
const listOfSectors = Object.values(SectorType).map(item => ({
  label: item,
  value: item,
}));

const listOfStates = Object.keys(Cities).map(key => ({
  label: key,
  value: key,
}));

// Get cities for selected state
const getCitiesForState = (state: string) => {
  if (!state || !Cities[state as keyof typeof Cities]) {
    return [];
  }
  return Cities[state as keyof typeof Cities].map(city => ({
    label: city.label,
    value: city.value,
  }));
};

// Direct CFA Supply options
const companyOptions = [
  'Sun Pharma','Abbott Healthcare','Abbott India',
  'Novo Nordisk','Cipla','Mankind',
  'Alkem','Intas','Lupin',
  'Torrent','Macleods','Dr Reddys',
  'Aristo','Zydus Cadila','Glaxo',
  'Emcure','Glenmark','IPCA',
  'USV','Micro Labs','Pfizer',
  'Alembic','Eris','JB Pharma',
  'FDC','Sanofi',
];

// RegisterFormData is now imported from Redux types

type RegisterViewNavigationProp = NativeStackNavigationProp<AuthNavigatorType>;

export const RegisterView: React.FC = () => {
  const navigation = useNavigation<RegisterViewNavigationProp>();
  const dispatch = useDispatch();
  
  // Redux state
  const formData = useSelector(selectRegisterFormData);
  const loading = useSelector(selectRegisterLoading);
  const error = useSelector(selectRegisterError);
  const success = useSelector(selectRegisterSuccess);
  const serverResponse = useSelector(selectRegisterServerResponse);
  const captchaImage = useSelector(selectCaptchaImage);

  // Local state
  const [uploading, setUploading] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Ensure this screen is properly focused when it loads
  useFocusEffect(
    React.useCallback(() => {
      // This ensures RegisterView is the active screen
      console.log('RegisterView is now focused');
    }, [])
  );

  // Handle success and error states
  useEffect(() => {
    if (success && serverResponse) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: serverResponse.message || 'Registration submitted successfully!',
      });
      handleClear(); // Clear form after successful submission
    }
  }, [success, serverResponse]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
    }
  }, [error]);

  const setData = (field: keyof RegisterFormData, value: any) => {
    dispatch(setRegisterFormData({[field]: value}));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: false}));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateGST = (gst: string) => {
    // Basic GST validation - 15 characters, alphanumeric
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
    return gstRegex.test(gst);
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.sector) newErrors.sector = true;
    if (!formData.companyName.trim()) newErrors.companyName = true;
    if (!formData.gstNumber.trim()) newErrors.gstNumber = true;
    if (!validateGST(formData.gstNumber)) newErrors.gstNumberFormat = true;
    if (!formData.gstCertificate) newErrors.gstCertificate = true;
    if (!formData.state) newErrors.state = true;
    if (!formData.city) newErrors.city = true;
    if (!formData.address.trim()) newErrors.address = true;
    if (!formData.pinCode.trim()) newErrors.pinCode = true;
    if (!formData.directCFASuppliers || formData.directCFASuppliers.length === 0) newErrors.directCFASuppliers = true;
    
    // Owner 1 validation
    if (!formData.owner1FullName.trim()) newErrors.owner1FullName = true;
    if (!formData.owner1EmailId.trim()) newErrors.owner1EmailId = true;
    if (!validateEmail(formData.owner1EmailId)) newErrors.owner1EmailIdFormat = true;
    if (!formData.owner1MobileNumber || formData.owner1MobileNumber.length !== 10) newErrors.owner1MobileNumber = true;
    
    // Owner 2 validation
    if (!formData.owner2FullName.trim()) newErrors.owner2FullName = true;
    if (!formData.owner2EmailId.trim()) newErrors.owner2EmailId = true;
    if (!validateEmail(formData.owner2EmailId)) newErrors.owner2EmailIdFormat = true;
    if (!formData.owner2MobileNumber || formData.owner2MobileNumber.length !== 10) newErrors.owner2MobileNumber = true;
    
    if (!formData.captcha.trim()) newErrors.captcha = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = [];
      if (newErrors.sector) errorMessages.push('Please select a sector');
      if (newErrors.companyName) errorMessages.push('Please enter company name');
      if (newErrors.gstNumber) errorMessages.push('Please enter GST number');
      if (newErrors.gstNumberFormat) errorMessages.push('Please enter valid GST number (15 characters)');
      if (newErrors.gstCertificate) errorMessages.push('Please upload GST certificate');
      if (newErrors.state) errorMessages.push('Please select state');
      if (newErrors.city) errorMessages.push('Please select city');
      if (newErrors.address) errorMessages.push('Please enter address');
      if (newErrors.pinCode) errorMessages.push('Please enter pin code');
      if (newErrors.directCFASuppliers) errorMessages.push('Please select at least one company');
      
      // Owner 1 error messages
      if (newErrors.owner1FullName) errorMessages.push('Please enter Owner 1 full name');
      if (newErrors.owner1EmailId) errorMessages.push('Please enter Owner 1 email ID');
      if (newErrors.owner1EmailIdFormat) errorMessages.push('Please enter valid Owner 1 email ID');
      if (newErrors.owner1MobileNumber) errorMessages.push('Please enter valid Owner 1 10-digit mobile number');
      
      // Owner 2 error messages
      if (newErrors.owner2FullName) errorMessages.push('Please enter Owner 2 full name');
      if (newErrors.owner2EmailId) errorMessages.push('Please enter Owner 2 email ID');
      if (newErrors.owner2EmailIdFormat) errorMessages.push('Please enter valid Owner 2 email ID');
      if (newErrors.owner2MobileNumber) errorMessages.push('Please enter valid Owner 2 10-digit mobile number');
      
      if (newErrors.captcha) errorMessages.push('Please enter captcha');

      Alert.alert('Validation Error', errorMessages.join('\n'));
      return false;
    }

    return true;
  };

  const handleClear = () => {
    dispatch(resetRegisterForm());
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Prepare API request data
    const apiRequest = {
      company_name: formData.companyName,
      sector: formData.sector,
      state: formData.state,
      city: formData.city,
      gst_number: formData.gstNumber,
      address: formData.address,
      pin_code: formData.pinCode,
      gstDoc: formData.gstCertificate,
      client_details: [
        {
          name_of_client: formData.owner1FullName,
          contact_number: formData.owner1MobileNumber,
          email: formData.owner1EmailId,
        },
        {
          name_of_client: formData.owner2FullName,
          contact_number: formData.owner2MobileNumber,
          email: formData.owner2EmailId,
        }
      ],
      company_list: formData.directCFASuppliers,
    };

    dispatch(submitRegisterForm(apiRequest));
  };

  const handleReset = () => {
    handleClear();
  };

  const handleUploadGST = (file?: DocumentPickerResponse) => {
    if (file) {
      setUploading(true);
      setTimeout(() => {
        setData('gstCertificate', file);
        setUploading(false);
        setIsUploadModalVisible(false);
        if (errors.gstCertificate) {
          setErrors(prev => ({...prev, gstCertificate: false}));
        }
      }, 1000);
    } else {
      setIsUploadModalVisible(false);
    }
  };

  const reloadCaptcha = () => {
    // Mock captcha reload
    const captchaChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newCaptcha = '';
    for (let i = 0; i < 6; i++) {
      newCaptcha += captchaChars.charAt(Math.floor(Math.random() * captchaChars.length));
    }
    dispatch(setCaptchaImage(newCaptcha));
    setData('captcha', '');
  };

  return (
    <Container>
      <AppBar title="Register Your Company" hideHamburger />
      <View>
        <View style={styles.subContainer}>
          <Text style={styles.subheader}>Company Registration</Text>
        </View>
      </View>
      <KeyboardAwareScrollView style={{flexGrow: 1}}>
        <View style={styles.inputContainer}>
          {/* Select Sector */}
          <CustomDropdown
            label="Select Sector"
            data={listOfSectors}
            showSearch={true}
            onChange={value => setData('sector', value)}
            value={formData.sector}
            placeholder="Select Sector *"
            containerStyle={errors.sector ? styles.errorBorder : undefined}
          />

          {/* Company Name */}
          <Input
            label="Company Name"
            placeholder="Enter Company Name"
            value={formData.companyName}
            maxLength={100}
            onChangeText={value => setData('companyName', value)}
            containerStyle={errors.companyName ? styles.errorBorder : undefined}
          />
          <Text style={styles.hintText}>As per GST Certificate</Text>

          {/* GST Number */}
          <Input
            label="GST Number"
            placeholder="Enter GST Number"
            value={formData.gstNumber}
            maxLength={15}
            autoCapitalize="characters"
            onChangeText={value => {
              const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
              setData('gstNumber', formatted);
            }}
            containerStyle={(errors.gstNumber || errors.gstNumberFormat) ? styles.errorBorder : undefined}
          />

          {/* Upload GST Certificate */}
          <View style={styles.uploadContainer}>
            <DashedButton
              label="Upload GST Certificate"
              onPress={() => setIsUploadModalVisible(true)}
              containerStyle={errors.gstCertificate ? styles.errorBorder : undefined}
            />
            <Text style={styles.uploadHint}>
              Allowed types: .pdf, .jpg, .jpeg, .png | Max size: 1,000 KB
            </Text>
            {formData.gstCertificate && (
              <Text style={styles.uploadedFile}>
                ✓ {formData.gstCertificate.name}
              </Text>
            )}
          </View>

          {/* Select State */}
          <CustomDropdown
            label="Select State"
            data={listOfStates}
            showSearch={true}
            onChange={value => {
              setData('state', value);
              setData('city', ''); // Reset city when state changes
            }}
            value={formData.state}
            placeholder="Select State *"
            containerStyle={errors.state ? styles.errorBorder : undefined}
          />

          {/* Select City */}
          <CustomDropdown
            label="Select City"
            data={getCitiesForState(formData.state)}
            showSearch={true}
            onChange={value => setData('city', value)}
            value={formData.city}
            placeholder="Select City *"
            containerStyle={errors.city ? styles.errorBorder : undefined}
            editable={!!formData.state}
          />

          {/* Address */}
          <Input
            label="Address"
            placeholder="Enter Complete Address"
            value={formData.address}
            maxLength={200}
            multiline={true}
            numberOfLines={3}
            onChangeText={value => setData('address', value)}
            containerStyle={errors.address ? styles.errorBorder : undefined}
          />

          {/* Pin Code */}
          <Input
            label="Pin Code"
            placeholder="Enter Pin Code"
            value={formData.pinCode}
            maxLength={6}
            keyboardType="numeric"
            onChangeText={value => setData('pinCode', value)}
            containerStyle={errors.pinCode ? styles.errorBorder : undefined}
          />

          {/* Owner 1 / Director 1 / Designated Partner 1 */}
          <View style={styles.ownerSection}>
            <Text style={styles.ownerTitle}>Owner 1 / Director 1 / Designated Partner 1</Text>
            
            {/* Owner 1 Full Name */}
            <View style={styles.ownerFieldContainer}>
              <Text style={styles.ownerFieldLabel}>Full Name</Text>
              <View style={[
                styles.ownerInputContainer,
                errors.owner1FullName ? styles.errorBorder : undefined
              ]}>
                <TextInput
                  placeholder="Full Name *"
                  value={formData.owner1FullName}
                  maxLength={50}
                  onChangeText={value => setData('owner1FullName', value)}
                  style={styles.ownerInputStyle}
                  placeholderTextColor={Colors.gray300}
                />
              </View>
            </View>

            {/* Owner 1 Email ID */}
            <View style={styles.ownerFieldContainer}>
              <Text style={styles.ownerFieldLabel}>Email ID</Text>
              <View style={[
                styles.ownerInputContainer,
                (errors.owner1EmailId || errors.owner1EmailIdFormat) ? styles.errorBorder : undefined
              ]}>
                <TextInput
                  placeholder="Email ID *"
                  value={formData.owner1EmailId}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={value => setData('owner1EmailId', value)}
                  style={styles.ownerInputStyle}
                  placeholderTextColor={Colors.gray300}
                />
              </View>
            </View>

            {/* Owner 1 Mobile Number */}
            <View style={styles.ownerFieldContainer}>
              <Text style={styles.ownerFieldLabel}>Mobile Number</Text>
              <View style={[
                styles.ownerInputContainer,
                errors.owner1MobileNumber ? styles.errorBorder : undefined
              ]}>
                <TextInput
                  placeholder="Mobile Number *"
                  value={formData.owner1MobileNumber}
                  maxLength={10}
                  keyboardType="numeric"
                  onChangeText={value => setData('owner1MobileNumber', value)}
                  style={styles.ownerInputStyle}
                  placeholderTextColor={Colors.gray300}
                />
              </View>
            </View>
            <Text style={styles.hintText}>10 digit mobile number without country code</Text>
          </View>

          {/* Owner 2 / Director 2 / Designated Partner 2 */}
          <View style={styles.ownerSection}>
            <Text style={styles.ownerTitle}>Owner 2 / Director 2 / Designated Partner 2</Text>
            
            {/* Owner 2 Full Name */}
            <View style={styles.ownerFieldContainer}>
              <Text style={styles.ownerFieldLabel}>Full Name</Text>
              <View style={[
                styles.ownerInputContainer,
                errors.owner2FullName ? styles.errorBorder : undefined
              ]}>
                <TextInput
                  placeholder="Full Name *"
                  value={formData.owner2FullName}
                  maxLength={50}
                  onChangeText={value => setData('owner2FullName', value)}
                  style={styles.ownerInputStyle}
                  placeholderTextColor={Colors.gray300}
                />
              </View>
            </View>

            {/* Owner 2 Email ID */}
            <View style={styles.ownerFieldContainer}>
              <Text style={styles.ownerFieldLabel}>Email ID</Text>
              <View style={[
                styles.ownerInputContainer,
                (errors.owner2EmailId || errors.owner2EmailIdFormat) ? styles.errorBorder : undefined
              ]}>
                <TextInput
                  placeholder="Email ID *"
                  value={formData.owner2EmailId}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={value => setData('owner2EmailId', value)}
                  style={styles.ownerInputStyle}
                  placeholderTextColor={Colors.gray300}
                />
              </View>
            </View>

            {/* Owner 2 Mobile Number */}
            <View style={styles.ownerFieldContainer}>
              <Text style={styles.ownerFieldLabel}>Mobile Number</Text>
              <View style={[
                styles.ownerInputContainer,
                errors.owner2MobileNumber ? styles.errorBorder : undefined
              ]}>
                <TextInput
                  placeholder="Mobile Number *"
                  value={formData.owner2MobileNumber}
                  maxLength={10}
                  keyboardType="numeric"
                  onChangeText={value => setData('owner2MobileNumber', value)}
                  style={styles.ownerInputStyle}
                  placeholderTextColor={Colors.gray300}
                />
              </View>
            </View>
            <Text style={styles.hintText}>10 digit mobile number without country code</Text>
          </View>

          {/* Direct CFA Supply Company */}
          <View>
            <Text style={styles.cfaTitle}>Direct CFA Supply Company *</Text>
            <Text style={styles.cfaSubtitle}>Select each company where you have DIRECT CFA supply</Text>
            <View style={[styles.checkboxGroup, errors.directCFASuppliers ? styles.errorBorder : undefined]}>
              {companyOptions.map(option => {
                const selected = formData.directCFASuppliers.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.checkboxItem}
                    onPress={() => {
                      const isSelected = formData.directCFASuppliers.includes(option);
                      const next = isSelected
                        ? formData.directCFASuppliers.filter(c => c !== option)
                        : [...formData.directCFASuppliers, option];
                      setData('directCFASuppliers', next);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkboxBox, selected && styles.checkboxBoxSelected]}>
                      {selected && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.directCFASuppliers && (
              <Text style={styles.errorText}>Please select at least one company</Text>
            )}
          </View>

          {/* Captcha */}
          <View style={styles.captchaContainer}>
            <Text style={styles.captchaLabel}>Captcha *</Text>
            <View style={styles.captchaRow}>
              <View style={styles.captchaImageContainer}>
                <Text style={styles.captchaImage}>{captchaImage}</Text>
              </View>
              <TouchableOpacity onPress={reloadCaptcha} style={styles.reloadButton}>
                <Text style={styles.reloadText}>Reload Captcha</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Enter Captcha"
              value={formData.captcha}
              maxLength={6}
              autoCapitalize="characters"
              onChangeText={value => setData('captcha', value.toUpperCase())}
              containerStyle={[
                styles.captchaInput,
                errors.captcha ? styles.errorBorder : undefined
              ]}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer Buttons */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Modal */}
      <UploadModal
        visible={isUploadModalVisible}
        allowedFileTypes={['pdf', 'jpg', 'jpeg', 'png']}
        onClose={handleUploadGST}
      />

      {/* Loading Modal */}
      <Modal transparent visible={loading || uploading}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.loadingText}>
            {uploading ? 'Uploading...' : 'Submitting...'}
          </Text>
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
  hintText: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginTop: -scaleHeight(15),
    marginBottom: scaleHeight(5),
  },
  uploadContainer: {
    marginBottom: scaleHeight(10),
  },
  uploadHint: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginTop: scaleHeight(8),
    textAlign: 'center',
  },
  uploadedFile: {
    fontSize: scaleFont(12),
    color: Colors.green,
    marginTop: scaleHeight(5),
    textAlign: 'center',
  },
  captchaContainer: {
    marginTop: scaleHeight(10),
  },
  captchaLabel: {
    fontSize: scaleFont(14),
    fontWeight: fontWeight.Medium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
    gap: scaleWidth(10),
  },
  captchaImageContainer: {
    backgroundColor: '#f0f0f0',
    padding: scaleWidth(12),
    borderRadius: scaleWidth(4),
    borderWidth: 1,
    borderColor: Colors.graybase,
    minWidth: scaleWidth(100),
    alignItems: 'center',
  },
  captchaImage: {
    fontSize: scaleFont(18),
    fontWeight: fontWeight.Bold,
    color: Colors.darkblack,
    letterSpacing: 2,
  },
  reloadButton: {
    padding: scaleWidth(8),
  },
  reloadText: {
    fontSize: scaleFont(12),
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
  },
  captchaInput: {
    marginTop: 0,
    marginBottom: scaleHeight(20),
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(16),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.graybase,
    gap: scaleWidth(12),
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.red,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(4),
    alignItems: 'center',
  },
  submitText: {
    color: Colors.white,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(4),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9c27b0', // Purple border
  },
  resetText: {
    color: '#9c27b0', // Purple text
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: {
    marginTop: scaleHeight(10),
    fontSize: scaleFont(16),
    color: Colors.white,
  },
  errorBorder: {
    borderColor: Colors.red,
    borderWidth: 1,
  },
  // CFA checkbox styles
  cfaTitle: {
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
  },
  cfaSubtitle: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginTop: scaleHeight(6),
    marginBottom: scaleHeight(6),
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(4),
    padding: scaleWidth(8),
  },
  checkboxItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
  },
  checkboxBox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    marginRight: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(12),
  },
  checkboxLabel: {
    color: Colors.darkblack,
    fontSize: scaleFont(13),
  },
  errorText: {
    color: Colors.red,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(4),
  },
  // Owner section styles
  ownerSection: {
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(10),
  },
  ownerTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(15),
  },
  // Custom input styles for owner fields
  ownerFieldContainer: {
    marginBottom: scaleHeight(15),
  },
  ownerFieldLabel: {
    fontSize: scaleFont(14),
    color: Colors.gray,
    marginBottom: scaleHeight(6),
  },
  ownerInputContainer: {
    height: scaleHeight(50),
    borderWidth: scaleWidth(1.5),
    borderRadius: scaleWidth(4),
    borderColor: Colors.gray300,
    paddingHorizontal: scaleWidth(12),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  ownerInputStyle: {
    height: scaleHeight(50),
    color: Colors.darkGray,
    fontSize: scaleFont(14),
    flex: 1,
    paddingVertical: scaleHeight(8),
  },
});

