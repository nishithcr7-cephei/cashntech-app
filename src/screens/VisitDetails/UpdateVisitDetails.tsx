import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  BackHandler,
  Keyboard,
} from 'react-native';
import {
  AppBar,
  Container,
  DateNTimePicker,
  FooterButton,
  Input,
} from '@components/index';
import {LeftChevronCircle, LeftChevron} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {useNavigation, useRoute} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';
import {useDispatch, useSelector} from 'react-redux';
import {userSelector} from '@store/user';
import {decryptLocation} from '@utils/crypto';
import visitApi from '@services/api/visit.api';
import Toast from 'react-native-toast-message';

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

interface UpdateVisitDetailsParams {
  visitId: string;
  visit_date_time: string;
  salesperson: string;
  client_firm_name: string;
  visit_type: string;
  visit_number: number;
  visit_remark: string;
  clientId?: string; // Add clientId to distinguish from visitId
}

export const UpdateVisitDetails = () => {
  const navigation = useNavigation<DocNavigationType>();
  const route = useRoute();
  const params = route.params as UpdateVisitDetailsParams;
  const dispatch = useDispatch();
  
  
  
  // Get logged-in user info
  const userInfo = useSelector(userSelector.getUserInfo);
  
  // State for form fields
  const [visitDate, setVisitDate] = useState<Date | null>(
    params.visit_date_time ? new Date(params.visit_date_time) : new Date(),
  );
  const [salesPersonName, setSalesPersonName] = useState(
    userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : ''
  );
  const [firmName, setFirmName] = useState(decryptLocation(params.client_firm_name || ''));
  const [visitType, setVisitType] = useState(params.visit_type || '');
  const [visitNumber, setVisitNumber] = useState(String((params.visit_number || 0) + 1));
  const [remark, setRemark] = useState(''); // Start with empty remark
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // Navigate to VisitDetail screen
      (navigation as any).navigate('VisitDetail');
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  const handleSubmit = async () => {
    // Dismiss keyboard first to prevent flickering
    Keyboard.dismiss();
    
    // Validation for editable fields
    if (!visitDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a visit date',
      });
      return;
    }

    if (!remark || remark.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a remark',
      });
      return;
    }

    if (!visitNumber || visitNumber.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a visit number',
      });
      return;
    }

    const visitNumberInt = parseInt(visitNumber);
    if (isNaN(visitNumberInt) || visitNumberInt <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid visit number',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        firm_name: firmName,
        remark: remark.trim(),
        salesperson: salesPersonName,
        visit_date_time: visitDate.toISOString(),
        visit_number: visitNumberInt,
        visit_type: visitType,
      };
      
      // Construct the full URL - use clientId for the API call
      const clientId = params.clientId || params.visitId; // Fallback to visitId if clientId not provided
      const fullUrl = `/client-info-master/visit/update/${clientId}`;
      
     
      
      const {data, error} = await visitApi.updateVisitDetails(clientId, updateData);
      
    
      
      if (error) {
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error?.message || 'Failed to update visit details',
        });
        return;
      }
      
      console.log('Showing success toast:', data?.message);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: data?.message || 'Visit details updated successfully',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
      
      // Add delay to show toast before navigation
      setTimeout(() => {
        (navigation as any).navigate('VisitDetail');
      }, 2000);
    } catch (error) {
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update visit details',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setVisitDate(new Date());
    setRemark('');
    setVisitNumber(String((params.visit_number || 0) + 1));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Container>
      <AppBar 
        title="Update Visit Details" 
        navigation={navigation}
        renderLeftIcon={<LeftChevron height={20} width={20} />}
        onPressLeftIcon={() => (navigation as any).navigate('VisitDetail')}
      />
      <View style={styles.subContainer}>
        
        <Text style={styles.subheader}>Update Visit Details - ID: {params.visitId}</Text>
      </View>
      <KeyboardAvoidingScrollView 
        style={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{flexGrow: 1}}
        showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
          <DateNTimePicker
            label="Visit Date"
            placeholder="Select Visit Date"
            value={visitDate || undefined}
            onConfirm={setVisitDate}
            mode="date"
          />
          
          <Input
            label="Sales Person Name"
            placeholder="Sales Person Name"
            value={salesPersonName}
            editable={false}
          />
          
          <Input
            label="Firm Name"
            placeholder="Firm Name"
            value={firmName}
            editable={false}
          />
          
          <Input
            label="Visit Type"
            placeholder="Visit Type"
            value={visitType}
            editable={false}
          />
          
          <Input
            label="Visit Number"
            placeholder="Visit Number"
            value={visitNumber}
            editable={false}
          />
          
          <Input
            label="Remark"
            placeholder="Enter remark"
            value={remark}
            onChangeText={setRemark}
            onBlur={dismissKeyboard}
            onFocus={() => {
              // Optional: Add any focus handling if needed
            }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => (navigation as any).navigate('VisitDetail')}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          </View>
      </KeyboardAvoidingScrollView>
      <Modal transparent visible={isSubmitting}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#e30613" />
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingVertical: 8,
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
  submitButton: {
    backgroundColor: Colors.green,
    borderRadius: 6,
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.4,
    marginRight: scaleWidth(10),
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
  },
  cancelButton: {
    backgroundColor: '#e30613',
    borderRadius: 6,
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.4,
    marginLeft: scaleWidth(10),
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: scaleHeight(20),
    justifyContent: 'center',
  },
});

export default UpdateVisitDetails;
