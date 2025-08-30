import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LeadNavigatorType} from '@type/NavigatorTypes';
import {LeadProgress, LeadProgressInfo} from '@screens/index';

const Stack = createNativeStackNavigator<LeadNavigatorType>();

export const LeadNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="LeadProgress" component={LeadProgress} />
      <Stack.Screen name="LeadProgressInfo" component={LeadProgressInfo} />
    </Stack.Navigator>
  );
};
