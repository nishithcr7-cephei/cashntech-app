import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {Button, Container, Header} from '@components/index';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {AuthScreens, Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {useDispatch, useSelector} from 'react-redux';
import {completeConsentRequest} from '@store/auth/auth.slice';
import {authSelector} from '@store/auth';
import type {ILmsUser} from '@store/auth/auth.types';
import Toast from 'react-native-toast-message';

type ConsentScreenProps = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.ConsentScreen
>;

const formatAgreementLabel = (type: string) =>
  type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

export const ConsentScreen = ({navigation, route}: ConsentScreenProps) => {
  const {mobile_number, continuationToken, pendingAgreementTypes} =
    route.params;
  const dispatch = useDispatch();
  const isLoading = useSelector(authSelector.getGlobalLoader);
  const [accepted, setAccepted] = useState(false);

  const agreementLabels = useMemo(
    () =>
      (pendingAgreementTypes?.length
        ? pendingAgreementTypes
        : ['terms_and_conditions']
      ).map(formatAgreementLabel),
    [pendingAgreementTypes],
  );

  const onPressContinue = () => {
    if (!accepted) {
      Toast.show({
        type: 'error',
        text1: 'Please accept the agreements to continue',
        visibilityTime: 2500,
      });
      return;
    }

    dispatch(
      completeConsentRequest({
        payload: {
          mobile_number,
          continuationToken,
          acceptedAgreementTypes: pendingAgreementTypes?.length
            ? pendingAgreementTypes
            : [],
        },
        callbackSuccess: (user: ILmsUser) => {
          Toast.show({
            type: 'success',
            text1: 'Consent recorded',
            visibilityTime: 2000,
          });
          navigation.replace(AuthScreens.SuccessScreen, {
            authMode: 'signin',
            firstName: user.first_name,
            lastName: user.last_name,
          });
        },
        callbackError: errorMessage => {
          Toast.show({
            type: 'error',
            text1: errorMessage || 'Could not complete consent',
            visibilityTime: 3000,
          });
        },
      }),
    );
  };

  return (
    <Container>
      <Header title="Agreements" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Please accept to continue</Text>
        <Text style={styles.subtitle}>
          Your organisation requires acceptance of the following agreements
          before you can use the app.
        </Text>

        <View style={styles.list}>
          {agreementLabels.map(label => (
            <View key={label} style={styles.row}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.rowText}>{label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAccepted(v => !v)}
          activeOpacity={0.7}>
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and accept the agreements listed above.
          </Text>
        </TouchableOpacity>

        <Button
          buttonText="Continue"
          onPress={onPressContinue}
          showLoader={isLoading}
          disabled={isLoading || !accepted}
        />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleWidth(24),
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(12),
  },
  title: {
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(20),
    color: Colors.black,
    marginBottom: scaleHeight(8),
  },
  subtitle: {
    fontFamily: Fonts.GilroyRegular,
    fontSize: scaleFont(14),
    color: Colors.graybase || '#666',
    marginBottom: scaleHeight(20),
    lineHeight: scaleFont(20),
  },
  list: {
    marginBottom: scaleHeight(24),
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    padding: scaleWidth(16),
  },
  row: {
    flexDirection: 'row',
    marginBottom: scaleHeight(8),
  },
  bullet: {
    marginRight: scaleWidth(8),
    fontSize: scaleFont(14),
    color: Colors.black,
  },
  rowText: {
    flex: 1,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
    color: Colors.black,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(24),
  },
  checkbox: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderWidth: 1.5,
    borderColor: Colors.primaryColor || '#E30613',
    borderRadius: 4,
    marginRight: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryColor || '#E30613',
  },
  checkMark: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyBold,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: Fonts.GilroyRegular,
    fontSize: scaleFont(14),
    color: Colors.black,
    lineHeight: scaleFont(20),
  },
});
