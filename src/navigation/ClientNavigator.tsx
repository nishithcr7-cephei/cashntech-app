import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  InboundClientList,
  SubInboundClientList,
  ClientInfo,
  FormSelectionScreen,
  CreateClientForm,
  BasicDetailForm,
  ClientDetailForm,
  FirmDetailForm,
  VendorDetailForm,
  VisitDetailForm,
  VisitDetail,
  UpdateVisitDetails,
  ProfileScreen,
  ClientLeadInfoTab,
} from '@screens/index';
import {ClientNavigatorType} from '@type/NavigatorTypes';
import {ClientScreens} from '@constants/Screens';

const Stack = createNativeStackNavigator<ClientNavigatorType>();

export const ClientNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={ClientScreens.InboundClientList} component={InboundClientList} />
      <Stack.Screen name={ClientScreens.SubInboundClientList} component={SubInboundClientList} />
      <Stack.Screen name={ClientScreens.ClientInfo} component={ClientInfo} />
      <Stack.Screen
        name={ClientScreens.FormSelectionScreen}
        component={FormSelectionScreen}
      />
      <Stack.Screen
        name={ClientScreens.CreateClientForm}
        component={CreateClientForm}
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
      <Stack.Screen
        name={ClientScreens.VisitDetail}
        component={VisitDetail}
      />
      <Stack.Screen
        name="UpdateVisitDetails"
        component={UpdateVisitDetails}
      />
      <Stack.Screen
        name={ClientScreens.ProfileScreen}
        component={ProfileScreen}
      />
      <Stack.Screen
        name={ClientScreens.ClientLeadInfoTab}
        component={ClientLeadInfoTab}
      />
    </Stack.Navigator>
  );
};
