import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  BusinessKYCValidation,
  DocumentValidation,
  DocValidForm,
  DocValidSelection,
  PersonalKYCValidation,
  TaskLogTabs,
  TaskHistTabs,
  TaskUpdate,
  SubTask,
  SubVisitDetail,
  UpdateVisitDetails,
} from '@screens/index';
import {DocNavigatorType} from '@type/NavigatorTypes';

const Stack = createNativeStackNavigator<DocNavigatorType>();

export const DocNavigator = () => {
  return (
    <Stack.Navigator id={undefined} screenOptions={{headerShown: false}}>
      <Stack.Screen name="DocumentValidation" component={DocumentValidation} />
      <Stack.Screen name="DocValidForm" component={DocValidForm} />
      <Stack.Screen name="DocValidSelection" component={DocValidSelection} />
      <Stack.Screen
        name="PersonalKYCValidation"
        component={PersonalKYCValidation}
      />
      <Stack.Screen
        name="BusinessKYCValidation"
        component={BusinessKYCValidation}
      />
      <Stack.Screen name="TaskLogTabs" component={TaskLogTabs} />
      <Stack.Screen name="TaskHistTabs" component={TaskHistTabs} />
      <Stack.Screen name="TaskUpdate" component={TaskUpdate} />
      <Stack.Screen name="SubTask" component={SubTask} />
      <Stack.Screen name="SubVisitDetail" component={SubVisitDetail} />
      <Stack.Screen name="UpdateVisitDetails" component={UpdateVisitDetails} />
    </Stack.Navigator>
  );
};
