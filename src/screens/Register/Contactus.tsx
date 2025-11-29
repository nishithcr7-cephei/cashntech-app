import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Colors, Fonts} from '@constants/index';
import fontWeight from '@constants/FontWeight';
import {Button} from '@components/Button/Button';
import {CustomDropdown} from '@components/Dropdown/CustomDropdown';
import {AppBar, Container} from '@components/index';
import {SectorType} from '@screens/ClientInfo/ClientInfo.type';
import {
  setContactFormData,
  setCaptchaText,
  submitContactForm,
  resetContactForm,
  selectContactFormData,
  selectContactLoading,
  selectContactError,
  selectContactSuccess,
  selectContactServerResponse,
  selectCaptchaText,
} from '@store/registerweb';

const ContactUs: React.FC = () => {
  const dispatch = useDispatch();
  const formData = useSelector(selectContactFormData);
  const loading = useSelector(selectContactLoading);
  const error = useSelector(selectContactError);
  const success = useSelector(selectContactSuccess);
  const serverResponse = useSelector(selectContactServerResponse);
  const captchaText = useSelector(selectCaptchaText);

  const sectorOptions = Object.values(SectorType).map(item => ({
    label: item,
    value: item,
  }));

  const countryCodeOptions = [
    {label: '+91 (India)', value: '+91'},
    {label: '+1 (USA)', value: '+1'},
    {label: '+44 (UK)', value: '+44'},
    {label: '+86 (China)', value: '+86'},
    {label: '+81 (Japan)', value: '+81'},
  ];

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length)) + ' ';
    }
    dispatch(setCaptchaText(result.trim()));
    dispatch(setContactFormData({captcha: ''}));
  };

  const handleInputChange = (field: string, value: string) => {
    dispatch(setContactFormData({[field]: value}));
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      Alert.alert('Error', 'Please enter company name');
      return false;
    }
    if (!formData.sector) {
      Alert.alert('Error', 'Please select sector');
      return false;
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!formData.captcha.trim()) {
      Alert.alert('Error', 'Please enter captcha');
      return false;
    }
    // Remove spaces from both captcha text and user input for comparison
    const captchaTextClean = captchaText.replace(/\s+/g, '').toLowerCase();
    const userInputClean = formData.captcha.replace(/\s+/g, '').toLowerCase();
    
    if (userInputClean !== captchaTextClean) {
      Alert.alert('Error', 'Invalid captcha');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    dispatch(submitContactForm(formData));
  };

  // Handle success and error states
  useEffect(() => {
    console.log('Success effect triggered:', { success, serverResponse });
    if (success && serverResponse) {
      console.log('Showing success toast with server response:', serverResponse);
      
      // Show toast with server response
      Toast.show({
        type: 'success',
        text1: 'Form Submitted Successfully!',
        text2: `Status: ${serverResponse.statusCode} - ${serverResponse.message}`,
        visibilityTime: 4000,
        onShow: () => {
          console.log('Toast shown');
        },
        onHide: () => {
          console.log('Toast hidden, resetting form');
          // Reset form and generate new captcha after toast is hidden
          dispatch(resetContactForm());
          generateCaptcha();
        }
      });
    }
  }, [success, serverResponse, dispatch]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Form Submission Failed',
        text2: error,
        visibilityTime: 4000,
      });
    }
  }, [error]);

  const ContactInfo = () => (
    <View style={styles.contactInfoContainer}>
      <View style={styles.contactInfoItem}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📍</Text>
        </View>
        <Text style={styles.contactInfoText}>
          Address: Cashntech Private Limited, 711 Clover Hills Plaza NIBM-Undri Road NIBM Annex, Pune - 411048 (MH), India.
        </Text>
      </View>
      
      <View style={styles.contactInfoItem}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>✉️</Text>
        </View>
        <Text style={styles.contactInfoText}>
          Mail: connect@cashntech.com
        </Text>
      </View>
      
      <View style={styles.contactInfoItem}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📞</Text>
        </View>
        <Text style={styles.contactInfoText}>
          Call Us: +91 8965878566, +91 9175855100
        </Text>
      </View>
    </View>
  );

  return (
    <Container>
      <AppBar title="Contact Us" hideHamburger />
      
      <View>
        <View style={styles.subContainer}>
          <Text style={styles.subheader}>Inquiry Form</Text>
        </View>
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Inquiry Form</Text>
        
        {/* Company Name */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Company Name"
            placeholderTextColor={Colors.gray300}
            value={formData.companyName}
            onChangeText={(text) => handleInputChange('companyName', text)}
          />
        </View>

        {/* Sector Dropdown */}
        <View style={styles.inputContainer}>
          <CustomDropdown
            label=""
            data={sectorOptions}
            value={formData.sector}
            placeholder="Please Select Sector"
            onChange={(value) => handleInputChange('sector', value)}
            showSearch={false}
            containerStyle={styles.dropdownContainer}
            dropdownStyle={styles.dropdownStyle}
          />
        </View>

        {/* Name */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Your Name"
            placeholderTextColor={Colors.gray300}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            placeholderTextColor={Colors.gray300}
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone Number */}
        <View style={styles.phoneContainer}>
          <View style={styles.phoneCodeContainer}>
            <CustomDropdown
              label=""
              data={countryCodeOptions}
              value={formData.phoneCode}
              placeholder="+91"
              onChange={(value) => handleInputChange('phoneCode', value)}
              showSearch={false}
              containerStyle={styles.phoneCodeDropdown}
              dropdownStyle={styles.dropdownStyle}
            />
          </View>
          <View style={styles.phoneNumberContainer}>
            <TextInput
              style={styles.phoneNumberInput}
              placeholder="Phone Number"
              placeholderTextColor={Colors.gray300}
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Monthly Turnover */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Monthly Turnover (in INR)"
            placeholderTextColor={Colors.gray300}
            value={formData.monthlyTurnover}
            onChangeText={(text) => handleInputChange('monthlyTurnover', text)}
            keyboardType="numeric"
          />
        </View>

        {/* Estimated Funding */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Estimated Funding Required (in INR)"
            placeholderTextColor={Colors.gray300}
            value={formData.estimatedFunding}
            onChangeText={(text) => handleInputChange('estimatedFunding', text)}
            keyboardType="numeric"
          />
        </View>

        {/* Message */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Message"
            placeholderTextColor={Colors.gray300}
            value={formData.message}
            onChangeText={(text) => handleInputChange('message', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Captcha */}
        <View style={styles.captchaContainer}>
          <View style={styles.captchaDisplay}>
            <Text style={styles.captchaText}>{captchaText}</Text>
            <TouchableOpacity onPress={generateCaptcha} style={styles.refreshButton}>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.captchaInputContainer}>
            <TextInput
              style={styles.captchaInput}
              placeholder="Enter Captcha"
              placeholderTextColor={Colors.gray300}
              value={formData.captcha}
              onChangeText={(text) => handleInputChange('captcha', text)}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Submit Button */}
        <Button
          buttonText="SUBMIT"
          onPress={handleSubmit}
          showLoader={loading}
          style={styles.submitButton}
        />
        </View>
        
        <ContactInfo />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  contactInfoContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(20),
  },
  iconContainer: {
    marginRight: scaleWidth(10),
    marginTop: scaleHeight(2),
  },
  iconText: {
    fontSize: scaleFont(16),
    color: Colors.primaryColor,
  },
  contactInfoText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.black,
    flex: 1,
    lineHeight: scaleFont(20),
  },
  formContainer: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(20),
  },
  formTitle: {
    fontSize: scaleFont(20),
    fontFamily: Fonts.GilroyBold,
    color: Colors.black,
    marginBottom: scaleHeight(20),
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: scaleHeight(15),
  },
  textInput: {
    height: scaleHeight(50),
    borderWidth: scaleWidth(1),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(15),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  dropdownContainer: {
    marginBottom: 0,
  },
  dropdownStyle: {
    height: scaleHeight(50),
    borderWidth: scaleWidth(1),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(15),
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: scaleHeight(15),
  },
  phoneCodeContainer: {
    width: scaleWidth(120),
    marginRight: scaleWidth(10),
  },
  phoneCodeDropdown: {
    marginBottom: 0,
  },
  phoneNumberContainer: {
    flex: 1,
  },
  phoneNumberInput: {
    height: scaleHeight(50),
    borderWidth: scaleWidth(1),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(15),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  messageInput: {
    height: scaleHeight(100),
    borderWidth: scaleWidth(1),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(15),
    paddingVertical: scaleHeight(15),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  captchaContainer: {
    marginBottom: scaleHeight(20),
  },
  captchaDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  captchaText: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroyBold,
    color: Colors.black,
    letterSpacing: scaleWidth(2),
    backgroundColor: Colors.gray200,
    paddingHorizontal: scaleWidth(15),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(4),
    marginRight: scaleWidth(10),
  },
  refreshButton: {
    padding: scaleWidth(8),
  },
  refreshIcon: {
    fontSize: scaleFont(16),
    color: Colors.primaryColor,
  },
  captchaInputContainer: {
    marginTop: scaleHeight(5),
  },
  captchaInput: {
    height: scaleHeight(50),
    borderWidth: scaleWidth(1),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(15),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  submitButton: {
    marginTop: scaleHeight(10),
    height: scaleHeight(50),
    borderRadius: scaleWidth(8),
  },
});

export default ContactUs;
