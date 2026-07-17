import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  OTPInputScreen,
  PasswordScreen,
  SigninScreen,
  SignupScreen,
  SuccessScreen,
  ProductSelectionScreen,
  TermsOfService,
  OcrInvoiceScreen,
  SelectUserTypeScreen,
  SelectProgramScreen,
  SelectRoleScreen,
} from '@screens/index';
import {SplashScreen} from '@screens/SplashScreen/SplashScreen';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {AuthScreens} from '@constants/Screens';
import {HomeNavigator} from './HomeNavigator';

const AuthStack = createNativeStackNavigator<AuthNavigatorType>();

export const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      id={undefined}
      screenOptions={{headerShown: false}}
      initialRouteName={AuthScreens.SplashScreen}>
      <AuthStack.Screen
        name={AuthScreens.SplashScreen}
        component={SplashScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.SigninScreen}
        component={SigninScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.SignupScreen}
        component={SignupScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.OTPInputScreen}
        component={OTPInputScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.PasswordScreen}
        component={PasswordScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.SuccessScreen}
        component={SuccessScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.ProductSelectionScreen}
        component={ProductSelectionScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.TermsOfService}
        component={TermsOfService}
      />
      <AuthStack.Screen
        name={AuthScreens.OcrInvoice}
        component={OcrInvoiceScreen}
      />
      <AuthStack.Screen
        name="SelectUserTypeScreen"
        component={SelectUserTypeScreen}
      />
      <AuthStack.Screen
        name="SelectProgramScreen"
        component={SelectProgramScreen}
      />
      <AuthStack.Screen
        name="SelectRoleScreen"
        component={SelectRoleScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.HomeNavigator}
        component={HomeNavigator}
      />
    </AuthStack.Navigator>
  );
};
