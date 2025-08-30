import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SoftNavigatorType} from '@type/NavigatorTypes';
import {
  RulesetTCPD,
  RulesetView,
  Softsanction,
  SoftsanctionProcess,
  SoftSanctionRuleset,
  UGROPurchaseMethod,
  UGROTurnoverMethod,
} from '@screens/index';


const Stack = createNativeStackNavigator<SoftNavigatorType>();

export const SoftNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Softsanction" component={Softsanction} />
      <Stack.Screen
        name="SoftsanctionProcess"
        component={SoftsanctionProcess}
      />
      <Stack.Screen
        name="SoftSanctionRuleset"
        component={SoftSanctionRuleset}
      />
      <Stack.Screen name="RulesetTCPD" component={RulesetTCPD} />

      <Stack.Screen name="RulesetView" component={RulesetView} />

      <Stack.Screen name="UGROTurnoverMethod" component={UGROTurnoverMethod} />
      <Stack.Screen name="UGROPurchaseMethod" component={UGROPurchaseMethod} />
    </Stack.Navigator>
  );
};
