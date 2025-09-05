import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {LeftChevronCircle} from '@assets/Icons';
import {
  Container,
  AppBar,
  Input,
  CustomDropdown,
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
import {CompositeScreenProps} from 'node_modules/@react-navigation/core/lib/typescript/module/src/types';
import {DrawerScreenProps} from '@react-navigation/drawer';

export enum IntentType {
  HIGH = 'High',
  LOW = 'Low',
  MEDIUM = 'Medium',
}

export enum UserResponse {
  INTERESTED = 'Interested',
  NOT_INTERESTED = 'Not Interested',
}

const listOfUserResponse = Object.values(UserResponse).map(item => ({
  label: item,
  value: item,
}));

const listOfIntentTypes = Object.values(IntentType).map(item => ({
  label: item,
  value: item,
}));

type Props = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, 'VisitDetailForm'>,
  DrawerScreenProps<HomeNavigatorType>
>;
export const VisitDetailForm = ({navigation}: Props) => {
  const dispatch = useDispatch();
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

  function setData<T extends keyof VisitDetailsType>(
    field: T,
    value: VisitDetailsType[T],
  ) {
    dispatch(clientActions.setVisitDetails({[field]: value}));
  }

  const handleClear = () => {
    dispatch(clientActions.clearVisitDetails());
  };

  const handleSave = () => {
    if (!validateVisitDetails()) return;
    dispatch(clientActions.saveVisitDetails());
  };

  const handleSubmit = () => {
    if (isSavedVisitDetails) {
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please save the form before proceeding to submit.',
      });
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
      if (!interestedFor?.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please fill the "Are you Interested for?" field.',
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
          />

          {userResponse === UserResponse.INTERESTED && (
            <>
              <CustomDropdown
                label="Intent"
                data={listOfIntentTypes}
                value={intent}
                onChange={value => setData('intent', value as IntentType)}
              />
              <DateNTimePicker
                label="Date of Next Visit"
                placeholder="DD/MM/YYYY"
                value={
                  dateOfNextVisit
                    ? moment(dateOfNextVisit).format('DD/MM/YYYY')
                    : ''
                }
                onConfirm={date => setData('dateOfNextVisit', date)}
              />
            </>
          )}
          {userResponse === UserResponse.NOT_INTERESTED && (
            <>
              <Input
                label="Reason for Not Interested"
                placeholder="value"
                value={reasonForNotInterested}
                onChangeText={value => setData('reasonForNotInterested', value)}
              />
              <Input
                label="Are you Interested for ?"
                placeholder="Are you Interested for ?"
                value={interestedFor}
                onChangeText={value => setData('interestedFor', value)}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingScrollView>
      <FooterButton
        onPressClearAll={handleClear}
        onPressSave={handleSave}
        onPressSubmit={handleSubmit}
        showNext={false}
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
