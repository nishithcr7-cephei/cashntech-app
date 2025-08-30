import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Report} from '@screens/index';
import {ReportNavigatorType} from '@type/NavigatorTypes';

const Stack = createNativeStackNavigator<ReportNavigatorType>();

export const ReportNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Report" component={Report} />
    </Stack.Navigator>
  );
};
