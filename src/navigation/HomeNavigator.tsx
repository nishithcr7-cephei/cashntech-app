import {DrawerContent} from '@components/index';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {scaleWidth} from '@utils/Scale';
import React from 'react';
import {Dimensions} from 'react-native';
import {ClientNavigator} from './ClientNavigator';
import {SoftNavigator} from './SoftNavigator';
import {LeadNavigator} from './LeadNavigator';
import {ReportNavigator} from './ReportNavigator';
import {KycNavigator} from './KycNavigator';
import {DocNavigator} from './DocNavigator';
import {
  ManageTask,
  VisitDetail,
  OcrInvoiceScreen,
  InvoiceDashboard,
  InvoiceDetails,
} from '@screens/index';

const Drawer = createDrawerNavigator<HomeNavigatorType>();

export const HomeNavigator = () => {
  return (
    <Drawer.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          borderTopRightRadius: scaleWidth(8),
          borderBottomRightRadius: scaleWidth(8),
          width: Dimensions.get('window').width * 0.7,
        },
      }}
      initialRouteName="InvoiceDashboard"
      drawerContent={DrawerContent}>
      <Drawer.Screen name="InvoiceDashboard" component={InvoiceDashboard} />
      <Drawer.Screen name="InvoiceDetails" component={InvoiceDetails} />
      <Drawer.Screen name="ClientNavigator" component={ClientNavigator} />
      <Drawer.Screen name="SoftNavigator" component={SoftNavigator} />
      <Drawer.Screen name="LeadNavigator" component={LeadNavigator} />
      <Drawer.Screen name="ReportNavigator" component={ReportNavigator} />
      <Drawer.Screen name="KycNavigator" component={KycNavigator} />
      <Drawer.Screen name="DocNavigator" component={DocNavigator} />
      <Drawer.Screen name="ManageTask" component={ManageTask} />
      <Drawer.Screen name="VisitDetail" component={VisitDetail} />
      <Drawer.Screen name="OcrInvoice" component={OcrInvoiceScreen} />
    </Drawer.Navigator>
  );
};
