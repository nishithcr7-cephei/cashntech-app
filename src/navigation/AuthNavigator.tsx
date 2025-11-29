import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  ApplyView,
  ContactUs,
  OTPInputScreen,
  PasswordScreen,
  RegisterView,
  SigninScreen,
  SignupScreen,
  SuccessScreen,
  TermsOfService,
  OcrInvoiceScreen,
} from '@screens/index';
import {OnBoarding} from '@screens/OnBoarding/OnBoarding';
import {SplashScreen} from '@screens/SplashScreen/SplashScreen';
import MenuPageView from '@screens/SplashScreen/MenuPageView';
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
        name={AuthScreens.OcrInvoice}
        component={OcrInvoiceScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.HomeNavigator}
        component={HomeNavigator}
      />
      
      {/* <AuthStack.Screen name={AuthScreens.OnBoarding} component={OnBoarding} /> */}
      
      {/* <AuthStack.Screen
        name={AuthScreens.MenuPageView}
        component={MenuPageView}
      /> */}
      
      {/* <AuthStack.Screen
        name={AuthScreens.RegisterView}
        component={RegisterView}
      /> */}
      
      {/* <AuthStack.Screen
        name={AuthScreens.ApplyView}
        component={ApplyView}
      /> */}
      
      {/* <AuthStack.Screen
        name={AuthScreens.ContactUs}
        component={ContactUs}
      /> */}
      
      {/* <AuthStack.Screen
        name={AuthScreens.SignupScreen}
        component={SignupScreen}
      /> */}
      {/* <AuthStack.Screen
        name={AuthScreens.SigninScreen}
        component={SigninScreen}
      /> */}
      {/* <AuthStack.Screen
        name={AuthScreens.OTPInputScreen}
        component={OTPInputScreen}
      /> */}
      {/* <AuthStack.Screen
        name={AuthScreens.PasswordScreen}
        component={PasswordScreen}
      /> */}
      {/* <AuthStack.Screen
        name={AuthScreens.SuccessScreen}
        component={SuccessScreen}
      /> */}
      {/* <AuthStack.Screen
        name={AuthScreens.TermsOfService}
        component={TermsOfService}
      /> */}
    </AuthStack.Navigator>
  );
};
