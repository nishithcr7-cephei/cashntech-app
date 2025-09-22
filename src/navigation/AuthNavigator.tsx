import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  OTPInputScreen,
  PasswordScreen,
  SigninScreen,
  SignupScreen,
  SuccessScreen,
  TermsOfService,
} from '@screens/index';
import {OnBoarding} from '@screens/OnBoarding/OnBoarding';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {AuthScreens} from '@constants/Screens';

const AuthStack = createNativeStackNavigator<AuthNavigatorType>();

export const AuthNavigator = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{headerShown: false}}
      initialRouteName={AuthScreens.SignupScreen}
    >
      <AuthStack.Screen name={AuthScreens.OnBoarding} component={OnBoarding} />
      
      <AuthStack.Screen
        name={AuthScreens.SignupScreen}
        component={SignupScreen}
      />
      <AuthStack.Screen
        name={AuthScreens.SigninScreen}
        component={SigninScreen}
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
        name={AuthScreens.TermsOfService}
        component={TermsOfService}
      />
    </AuthStack.Navigator>
  );
};
