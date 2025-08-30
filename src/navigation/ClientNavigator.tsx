import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  ClientInfo,
  ClientLeadInfoTab,
  FormSelectionScreen,
  CreateClientForm,
  BasicDetailForm,
  ClientDetailForm,
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
        component={FormSelectionScreen}
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
        name={ClientScreens.CreateClientForm}
        component={CreateClientForm}
      />

      <Stack.Screen name="ClientLeadInfoTab" component={ClientLeadInfoTab} />
    </Stack.Navigator>
  );
};
