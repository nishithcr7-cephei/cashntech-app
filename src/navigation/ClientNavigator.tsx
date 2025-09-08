import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  ClientInfo,
  FormSelectionScreen,
  BasicDetailForm,
  ClientDetailForm,
  FirmDetailForm,
  VendorDetailForm,
  VisitDetailForm,
  ProfileScreen,
} from '@screens/index';
import {ClientNavigatorType} from '@type/NavigatorTypes';
import {ClientScreens} from '@constants/Screens';

const Stack = createNativeStackNavigator<ClientNavigatorType>();

export const ClientNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={ClientScreens.ClientInfo} component={ClientInfo} />
      <Stack.Screen
        name={ClientScreens.FormSelectionScreen}
        component={ProfileScreen}
      />
      <Stack.Screen
        name={ClientScreens.BasicDetailForm}
        component={BasicDetailForm}
      />
      <Stack.Screen
        name={ClientScreens.ClientDetailForm}
        component={ClientDetailForm}
      />
      <Stack.Screen
        name={ClientScreens.FirmDetailForm}
        component={FirmDetailForm}
      />
      <Stack.Screen
        name={ClientScreens.VendorDetailForm}
        component={VendorDetailForm}
      />
      <Stack.Screen
        name={ClientScreens.VisitDetailForm}
        component={VisitDetailForm}
      />
    </Stack.Navigator>
  );
};
