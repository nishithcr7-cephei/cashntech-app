import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
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
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';
import {AuthScreens} from '@constants/Screens';
import {lookupGstDetails, submitApplyForm} from '@store/registerweb/register.saga';
import {
  selectGstLookupLoading,
  selectGstLookupError,
  selectGstLookupClientDetails,
  selectGstLookupRegistrationId,
  selectApplyLoading,
  selectApplyError,
  selectApplySuccess,
  selectApplyServerResponse,
} from '@store/registerweb/register.selector';
import {clearApplyError, resetApplyForm, clearGstLookupData} from '@store/registerweb/register.slice';
import {decryptUtility} from '@utils/crypto';

interface ApplyFormData {
  gstin: string;
  isRegistered: boolean;
  fullName: string;
  emailId: string;
  mobileNumber: string;
  applyFor: string;
  companySapCode: string;
  purchasePeriod: string;
  invoiceFile: DocumentPickerResponse | null;
  captcha: string;
}

// Apply for options
const applyForOptions = [
  {label: 'Sun Pharma', value: 'sun_pharma'},
  {label: 'Cipla', value: 'cipla'},
  {label: 'Zydus', value: 'zydus'},
];

export const ApplyView: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Redux selectors
  const gstLookupLoading = useSelector(selectGstLookupLoading);
  const gstLookupError = useSelector(selectGstLookupError);
  const gstLookupClientDetails = useSelector(selectGstLookupClientDetails);
  const gstLookupRegistrationId = useSelector(selectGstLookupRegistrationId);
  const applyLoading = useSelector(selectApplyLoading);
  const applyError = useSelector(selectApplyError);
  const applySuccess = useSelector(selectApplySuccess);
  const applyServerResponse = useSelector(selectApplyServerResponse);
  
  const [formData, setFormData] = useState<ApplyFormData>({
    gstin: '',
    isRegistered: false,
    fullName: '',
    emailId: '',
    mobileNumber: '',
    applyFor: '',
    companySapCode: '',
    purchasePeriod: '',
    invoiceFile: null,
    captcha: '',
  });

  const [uploading, setUploading] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [captchaImage, setCaptchaImage] = useState<string>('GMv x KB'); // Mock captcha
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Ensure this screen is properly focused when it loads
  useFocusEffect(
    React.useCallback(() => {
      console.log('ApplyView is now focused');
      // Clear any previous apply state when screen is focused
      // This prevents showing success/error toasts from previous submissions
      dispatch(resetApplyForm());
      // Clear any previous GST lookup data to prevent auto-filling from old data
      dispatch(clearGstLookupData());
    }, [dispatch])
  );

  // Handle GST lookup response
  useEffect(() => {
    if (gstLookupClientDetails && gstLookupClientDetails.length > 0) {
      // Auto-fill the first client's details in Owner 1 / Director 1 fields
      const firstClient = gstLookupClientDetails[0];
      
      try {
        const decryptedName = decryptUtility(firstClient.name_of_client);
        const decryptedEmail = decryptUtility(firstClient.email);
        const decryptedContact = decryptUtility(firstClient.contact_number);
        
        console.log('Auto-filling form with decrypted data:', {
          name: decryptedName,
          email: decryptedEmail,
          contact: decryptedContact
        });
        
        setFormData(prev => ({
          ...prev,
          fullName: decryptedName,
          emailId: decryptedEmail,
          mobileNumber: decryptedContact,
        }));
        
        Toast.show({
          type: 'success',
          text1: 'GST Details Found',
          text2: 'Owner details have been auto-filled',
        });
      } catch (error) {
        console.error('Error decrypting GST lookup data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to decrypt client details',
        });
      }
    }
  }, [gstLookupClientDetails]);

  // Handle GST lookup errors
  useEffect(() => {
    if (gstLookupError) {
      Toast.show({
        type: 'error',
        text1: 'GST Lookup Failed',
        text2: gstLookupError,
      });
    }
  }, [gstLookupError]);

  // Handle apply submission success
  useEffect(() => {
    if (applySuccess && applyServerResponse) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: applyServerResponse.message || 'Application submitted successfully',
      });
      handleClear();
    }
  }, [applySuccess, applyServerResponse]);

  // Handle apply submission errors
  useEffect(() => {
    if (applyError) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: applyError,
      });
    }
  }, [applyError]);

  const setData = (field: keyof ApplyFormData, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
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

  const handleGstInputChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setData('gstin', formatted);
    
    // Trigger GST lookup when complete GST number is entered
    if (formatted.length === 15 && validateGST(formatted)) {
      console.log('Triggering GST lookup for:', formatted);
      dispatch(lookupGstDetails(formatted));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    // First check if registration checkbox is checked
    if (!formData.isRegistered) {
      Toast.show({
        type: 'error',
        text1: 'Registration Required',
        text2: 'Please mark the checkbox to confirm you have completed the registration process',
      });
      return false;
    }

    if (!formData.gstin.trim()) newErrors.gstin = true;
    if (!validateGST(formData.gstin)) newErrors.gstinFormat = true;
    if (!formData.fullName.trim()) newErrors.fullName = true;
    if (!formData.emailId.trim()) newErrors.emailId = true;
    if (!validateEmail(formData.emailId)) newErrors.emailIdFormat = true;
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) newErrors.mobileNumber = true;
    if (!formData.applyFor) newErrors.applyFor = true;
    if (!formData.companySapCode.trim()) newErrors.companySapCode = true;
    if (!formData.purchasePeriod.trim()) newErrors.purchasePeriod = true;
    if (!formData.invoiceFile) newErrors.invoiceFile = true;
    if (!formData.captcha.trim()) newErrors.captcha = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = [];
      if (newErrors.gstin) errorMessages.push('Please enter GSTIN');
      if (newErrors.gstinFormat) errorMessages.push('Please enter valid GSTIN (15 characters)');
      if (newErrors.fullName) errorMessages.push('Please enter full name');
      if (newErrors.emailId) errorMessages.push('Please enter email ID');
      if (newErrors.emailIdFormat) errorMessages.push('Please enter valid email ID');
      if (newErrors.mobileNumber) errorMessages.push('Please enter valid 10-digit mobile number');
      if (newErrors.applyFor) errorMessages.push('Please select what you are applying for');
      if (newErrors.companySapCode) errorMessages.push('Please enter company SAP code');
      if (newErrors.purchasePeriod) errorMessages.push('Please enter purchase period');
      if (newErrors.invoiceFile) errorMessages.push('Please upload an invoice');
      if (newErrors.captcha) errorMessages.push('Please enter captcha');

      Alert.alert('Validation Error', errorMessages.join('\n'));
      return false;
    }

    return true;
  };

  const handleClear = () => {
    setFormData({
      gstin: '',
      isRegistered: false,
      fullName: '',
      emailId: '',
      mobileNumber: '',
      applyFor: '',
      companySapCode: '',
      purchasePeriod: '',
      invoiceFile: null,
      captcha: '',
    });
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Check if we have a registration ID from GST lookup
    if (!gstLookupRegistrationId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid GST number first to get registration details',
      });
      return;
    }

    // Dispatch the apply form submission
    dispatch(submitApplyForm(formData, gstLookupRegistrationId));
  };

  const handleReset = () => {
    handleClear();
  };

  const handleUploadInvoice = (file?: DocumentPickerResponse) => {
    if (file) {
      setUploading(true);
      setTimeout(() => {
        setData('invoiceFile', file);
        setUploading(false);
        setIsUploadModalVisible(false);
        if (errors.invoiceFile) {
          setErrors(prev => ({...prev, invoiceFile: false}));
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
    setCaptchaImage(newCaptcha);
    setData('captcha', '');
  };


  return (
    <Container>
      <AppBar title="Apply Now" hideHamburger />
      
      <View>
        <View style={styles.subContainer}>
          <Text style={styles.subheader}>Application Form</Text>
        </View>
      </View>
      
      <KeyboardAvoidingScrollView style={{flexGrow: 1}}>
        <View style={styles.container}>
          {/* Instruction Text */}
          <Text style={styles.instructionText}>
            Kindly ensure you are registered on the portal before filling the application form.
          </Text>

          {/* Registration Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => setData('isRegistered', !formData.isRegistered)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, formData.isRegistered && styles.checkboxBoxSelected]}>
                {formData.isRegistered && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                We have already completed the registration process for the working capital requirement on the portal and selected the required CFA names.
              </Text>
            </TouchableOpacity>
          </View>

          {/* GSTIN Input */}
          <Input
            label="GSTIN*"
            placeholder="Enter GSTIN"
            value={formData.gstin}
            maxLength={15}
            autoCapitalize="characters"
            onChangeText={handleGstInputChange}
            containerStyle={[
              styles.inputSpacing,
              (errors.gstin || errors.gstinFormat) ? styles.errorBorder : undefined
            ]}
            style={styles.inputContainer}
          />
          {gstLookupLoading && (
            <View style={styles.gstLoadingContainer}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.gstLoadingText}>Looking up GST details...</Text>
            </View>
          )}

          {/* Owner/Director/Designated Partner Section */}
          <Text style={styles.sectionTitle}>Owner 1 / Director 1 / Designated Partner 1</Text>

          {/* Full Name */}
          <Input
            label="Full Name*"
            placeholder="Enter Full Name"
            value={formData.fullName}
            maxLength={50}
            onChangeText={value => setData('fullName', value)}
            containerStyle={[
              styles.inputSpacing,
              errors.fullName ? styles.errorBorder : undefined
            ]}
            style={styles.inputContainer}
          />

          {/* Email ID */}
          <Input
            label="Email Id*"
            placeholder="Enter Email ID"
            value={formData.emailId}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={value => setData('emailId', value)}
            containerStyle={[
              styles.inputSpacing,
              (errors.emailId || errors.emailIdFormat) ? styles.errorBorder : undefined
            ]}
            style={styles.inputContainer}
          />

          {/* Mobile Number */}
          <Input
            label="Mobile Number*"
            placeholder="Enter Mobile Number"
            value={formData.mobileNumber}
            maxLength={10}
            keyboardType="numeric"
            onChangeText={value => setData('mobileNumber', value)}
            containerStyle={[
              styles.inputSpacing,
              errors.mobileNumber ? styles.errorBorder : undefined
            ]}
            style={styles.inputContainer}
          />

          {/* Apply For Dropdown */}
          <View style={styles.inputSpacing}>
            <CustomDropdown
              label="Apply for*"
              data={applyForOptions}
              showSearch={true}
              onChange={value => setData('applyFor', value)}
              value={formData.applyFor}
              placeholder="Select what you are applying for"
              containerStyle={errors.applyFor ? styles.errorBorder : undefined}
            />
          </View>

          {/* Company SAP Code */}
          <Input
            label="Company SAP Code*"
            placeholder="Enter Company SAP Code"
            value={formData.companySapCode}
            maxLength={20}
            onChangeText={value => setData('companySapCode', value)}
            containerStyle={[
              styles.inputSpacing,
              errors.companySapCode ? styles.errorBorder : undefined
            ]}
            style={styles.inputContainer}
          />

          {/* Purchase Period */}
          <Input
            label="Purchase Period*"
            placeholder="Jan25 to Jun25_Company_Purchase"
            value={formData.purchasePeriod}
            maxLength={100}
            onChangeText={value => setData('purchasePeriod', value)}
            containerStyle={[
              styles.inputSpacing,
              errors.purchasePeriod ? styles.errorBorder : undefined
            ]}
            style={styles.inputContainer}
          />
          <Text style={styles.hintText}>
            (Last 2 Calendar Quarters)
          </Text>

          {/* File Upload Section */}
          <View style={styles.uploadContainer}>
            <DashedButton
              label="Upload any one invoice"
              onPress={() => setIsUploadModalVisible(true)}
              containerStyle={errors.invoiceFile ? styles.errorBorder : undefined}
            />
            <Text style={styles.uploadHint}>
              Allowed types: .pdf, .png, .jpeg
            </Text>
            <Text style={styles.uploadHint}>
              Maximum file size allowed is 2,000 KB
            </Text>
            <Text style={styles.uploadNote}>
              No CSV OR XLS file. Only PDF or JPEG of printed invoices
            </Text>
            {formData.invoiceFile && (
              <Text style={styles.uploadedFile}>
                ✓ {formData.invoiceFile.name}
              </Text>
            )}
          </View>

          {/* Captcha Section */}
          <View style={styles.captchaContainer}>
            <Text style={styles.captchaLabel}>Enter Captcha</Text>
            <View style={styles.captchaRow}>
              <View style={styles.captchaImageContainer}>
                <Text style={styles.captchaImage}>{captchaImage}</Text>
              </View>
              <TouchableOpacity onPress={reloadCaptcha} style={styles.reloadButton}>
                <Text style={styles.reloadText}>🔄</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Enter Captcha"
              value={formData.captcha}
              maxLength={6}
              autoCapitalize="characters"
              onChangeText={value => {
                // Convert to uppercase and filter out non-alphanumeric characters
                const upperCaseValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setData('captcha', upperCaseValue);
              }}
              containerStyle={[
                styles.captchaInput,
                styles.inputSpacing,
                errors.captcha ? styles.errorBorder : undefined
              ]}
              style={styles.inputContainer}
            />
          </View>
        </View>
      </KeyboardAvoidingScrollView>

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
        allowedFileTypes={['pdf', 'png', 'jpeg']}
        onClose={handleUploadInvoice}
      />

      {/* Loading Modal */}
      <Modal transparent visible={applyLoading || uploading}>
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
    padding: scaleWidth(16),
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
  inputSpacing: {
    marginBottom: scaleHeight(25), // Increased spacing between inputs
  },
  inputContainer: {
    height: scaleHeight(50), // Increased input height
  },
  dropdownContainer: {
    height: scaleHeight(50), // Increased dropdown height
  },
  instructionText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    marginBottom: scaleHeight(16),
    lineHeight: scaleFont(20),
  },
  checkboxContainer: {
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(4),
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    marginRight: scaleWidth(8),
    marginTop: scaleHeight(2),
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
  checkboxText: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    lineHeight: scaleFont(20),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(16),
  },
  hintText: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginTop: -scaleHeight(15),
    marginBottom: scaleHeight(5),
  },
  uploadContainer: {
    marginBottom: scaleHeight(20),
  },
  uploadHint: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginTop: scaleHeight(8),
    textAlign: 'center',
  },
  uploadNote: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginTop: scaleHeight(4),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  uploadedFile: {
    fontSize: scaleFont(12),
    color: Colors.green,
    marginTop: scaleHeight(8),
    textAlign: 'center',
  },
  captchaContainer: {
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(20),
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
    fontSize: scaleFont(16),
  },
  captchaInput: {
    marginTop: 0,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.graybase,
    gap: scaleWidth(8),
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
  gstLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(8),
  },
  gstLoadingText: {
    marginLeft: scaleWidth(8),
    fontSize: scaleFont(12),
    color: Colors.primaryColor,
  },
});
