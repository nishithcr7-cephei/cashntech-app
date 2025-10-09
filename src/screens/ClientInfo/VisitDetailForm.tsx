import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {LeftChevronCircle} from '@assets/Icons';
import {
  Container,
  AppBar,
  Input,
  CustomDropdown,
  MultiSelectDropdown,
  DateNTimePicker,
  FooterButton,
} from '@components/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {ClientScreens, Colors} from '@constants/index';
import fontWeight from '@constants/FontWeight';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector, VisitDetailsType} from '@store/client';
import moment from 'moment';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import Toast from 'react-native-toast-message';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {IntentType, ReasonNotInterested, UserResponse} from './ClientInfo.type';
import {CompositeScreenProps} from '@react-navigation/native';

const listOfUserResponse = Object.values(UserResponse).map(item => ({
  label: item,
  value: item,
}));

const listOfIntentTypes = Object.values(IntentType).map(item => ({
  label: item,
  value: item,
}));

const listInterestedFor = Object.values(ReasonNotInterested).map(item => ({
  label: item,
  value: item,
}));

type Props = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, 'VisitDetailForm'>,
  DrawerScreenProps<HomeNavigatorType>
>;
export const VisitDetailForm: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch();
  const shouldNavigateAfterSave = useRef(false);
  const {
    userResponse,
    dateOfNextVisit,
    intent,
    reasonForNotInterested,
    interestedFor,
  } = useSelector(clientSelector.getVisitDetailsFormData);
  const visitLoader = useSelector(clientSelector.getClientLoader);
  const isSavedVisitDetails = useSelector(
    clientSelector.getSavedVisitDetailsStatus,
  );

  // Handle navigation after successful save and submit
  useEffect(() => {
    if (isSavedVisitDetails && shouldNavigateAfterSave.current) {
      shouldNavigateAfterSave.current = false;
      navigation.reset({
        index: 0,
        routes: [{name: ClientScreens.ClientInfo}],
      });
    }
  }, [isSavedVisitDetails, navigation]);

  function setData<T extends keyof VisitDetailsType>(
    field: T,
    value: VisitDetailsType[T],
  ) {
    dispatch(clientActions.setVisitDetails({[field]: value}));
    dispatch(clientActions.setSavedVisitDetailsStatus(false));
  }

  const handleClear = () => {
    dispatch(clientActions.clearVisitDetails());
  };

  const handleSave = () => {
    if (!validateVisitDetails()) return;
    dispatch(clientActions.saveVisitDetails());
  };

  const handleSubmit = () => {
    if (!validateVisitDetails()) return;
    
    if (isSavedVisitDetails) {
      // Data already saved, just show success and navigate
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Form submitted successfully!',
      });
      navigation.reset({
        index: 0,
        routes: [{name: ClientScreens.ClientInfo}],
      });
    } else {
      // Data not saved, call API to save and submit
      shouldNavigateAfterSave.current = true;
      dispatch(clientActions.saveVisitDetailsAndSubmit());
    }
  };

  const validateVisitDetails = (): boolean => {
    if (!userResponse) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a User Response.',
      });
      return false;
    }

    if (userResponse === UserResponse.INTERESTED) {
      if (!intent) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please select an Intent.',
        });
        return false;
      }
      if (!dateOfNextVisit) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please select a Date of Next Visit.',
        });
        return false;
      }
    }

    if (userResponse === UserResponse.NOT_INTERESTED) {
      if (!reasonForNotInterested?.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please provide a Reason for Not Interested.',
        });
        return false;
      }
    }

    // Validate interestedFor for both cases
    if (!interestedFor || interestedFor.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select at least one option for "Are you additionally interested for?".',
      });
      return false;
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
          <Text style={styles.subheader}>Visit Details</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingScrollView style={{flexGrow: 1}}>
        <View style={styles.inputContainer}>
          <CustomDropdown
            label="User Response"
            data={listOfUserResponse}
            value={userResponse}
            onChange={value => setData('userResponse', value as UserResponse)}
            showSearch={false}
          />

          {userResponse === UserResponse.INTERESTED && (
            <>
              <CustomDropdown
                label="Intent"
                data={listOfIntentTypes}
                value={intent}
                onChange={value => setData('intent', value as IntentType)}
                showSearch={false}
              />
              <DateNTimePicker
                label="Date of Next Visit"
                placeholder="DD/MM/YYYY"
                value={
                  dateOfNextVisit
                    ? moment(dateOfNextVisit).format('DD/MM/YYYY')
                    : ''
                }
                onConfirm={date =>
                  setData('dateOfNextVisit', date.toISOString())
                }
              />
            </>
          )}
          {userResponse === UserResponse.NOT_INTERESTED && (
            <Input
              label="Reason for Not Interested"
              placeholder="value"
              maxLength={100}
              value={reasonForNotInterested}
              onChangeText={value => setData('reasonForNotInterested', value)}
            />
          )}
          {userResponse && (
            <MultiSelectDropdown
              label="Are you additionally interested for?"
              data={listInterestedFor}
              value={interestedFor}
              onChange={value => setData('interestedFor', value)}
              placeholder="Select multiple options"
            />
          )}
        </View>
      </KeyboardAvoidingScrollView>
      <FooterButton
        onPressClearAll={handleClear}
        onPressSave={handleSave}
        onPressSubmit={handleSubmit}
        showNext={false}
        disableSubmit={!isSavedVisitDetails}
      />
      <Modal transparent visible={visitLoader}>
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
