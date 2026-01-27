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
  CreateInvoice,
  UploadInvoiceList,
  DealerInvoiceList,
  DiscountingPayments,
  PendingApprovals,
  RejectedFinances,
  DPDInvoiceList,
  FundingLimitsForDealers,
  ANCreditAccount,
  CreditAccountDetails,
  CreditAccountInvoiceNumber,
  CreditAccountDailyInterest,
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
      <Drawer.Screen name="CreateInvoice" component={CreateInvoice} />
      <Drawer.Screen name="UploadInvoiceList" component={UploadInvoiceList} />
      <Drawer.Screen name="DealerInvoiceList" component={DealerInvoiceList} />
      <Drawer.Screen name="DiscountingPayments" component={DiscountingPayments} />
      <Drawer.Screen name="PendingApprovals" component={PendingApprovals} />
      <Drawer.Screen name="RejectedFinances" component={RejectedFinances} />
      <Drawer.Screen name="DPDInvoiceList" component={DPDInvoiceList} />
      <Drawer.Screen name="FundingLimitsForDealers" component={FundingLimitsForDealers} />
      <Drawer.Screen name="ANCreditAccount" component={ANCreditAccount} />
      <Drawer.Screen name="CreditAccountDetails" component={CreditAccountDetails} />
      <Drawer.Screen name="CreditAccountInvoiceNumber" component={CreditAccountInvoiceNumber} />
      <Drawer.Screen name="CreditAccountDailyInterest" component={CreditAccountDailyInterest} />
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
