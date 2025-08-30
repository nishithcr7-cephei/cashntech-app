import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  CompanyDocument,
  CompanyPanCard,
  GodownDetails,
  GodownDetails2,
  GSTDocument,
  KycDocument,
  KycElectricityBill,
  KYCFormSelection,
  KycOwner,
  KycUplaodPan,
  KycUploadAdhar,
  KycUploadDoc,
  ResidenceDetail,
  ShareholdingCompany,
  UdhyamCertificate,
} from '@screens/index';
import {KycNavigatorType} from '@type/NavigatorTypes';

const Stack = createNativeStackNavigator<KycNavigatorType>();

export const KycNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="KycDocument" component={KycDocument} />
      <Stack.Screen name="KYCFormSelection" component={KYCFormSelection} />
      <Stack.Screen name="KycUploadDoc" component={KycUploadDoc} />
      <Stack.Screen name="KycUploadPan" component={KycUplaodPan} />
      <Stack.Screen name="KycUploadAdhar" component={KycUploadAdhar} />
      <Stack.Screen name="ResidenceDetail" component={ResidenceDetail} />
      <Stack.Screen name="KycElectricityBill" component={KycElectricityBill} />
      <Stack.Screen name="KycOwner" component={KycOwner} />
      <Stack.Screen name="UdhyamCertificate" component={UdhyamCertificate} />
      <Stack.Screen name="GSTDocument" component={GSTDocument} />
      <Stack.Screen name="GodownDetails" component={GodownDetails} />
      <Stack.Screen name="GodownDetails2" component={GodownDetails2} />
      <Stack.Screen name="CompanyPanCard" component={CompanyPanCard} />
      <Stack.Screen
        name="ShareholdingCompany"
        component={ShareholdingCompany}
      />
      <Stack.Screen name="CompanyDocument" component={CompanyDocument} />
    </Stack.Navigator>
  );
};
