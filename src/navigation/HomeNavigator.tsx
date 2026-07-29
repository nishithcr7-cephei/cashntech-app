import {DrawerContent} from '@components/index';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {scaleWidth} from '@utils/Scale';
import React, {useEffect} from 'react';
import {Dimensions} from 'react-native';
import {useDispatch} from 'react-redux';
import {fetchUserScopeRequest} from '@store/programSelection/programSelection.slice';
import {fetchPermissionsRequest} from '@store/permissions';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {
  OcrInvoiceScreen,
  InvoiceDashboard,
  InvoiceDetails,
  CreateInvoice,
  UploadInvoiceList,
  DealerInvoiceList,

  FundingLimitsForDealers,
  ANCreditAccount,
  CreditAccountDetails,
  CreditAccountInvoiceNumber,
  CreditAccountDailyInterest,
  FinancingRequestScreen,
  LimitDetailsScreen,
  DealerMakerDashboardScreen,
  ODDetailsScreen,
  ODRepaymentsScreen,
  AnchorsListScreen,
  InvoiceDetailView,
  InvoiceUploadPreview,
  DealerInvoiceDetailsScreen,
  DisbursementScreen,
  InterestAccrualsScreen,
  InvoiceDailyInterestScreen,
  RepaymentSettlementScreen,
  DPDPenalInterestNPAScreen,
  StatementOfAccount,
  SOADealerList,
  ProfileScreen,
  SelectProgramScreen,
  AllLoanReportScreen,
  DisbursementReportScreen,
  DpdReportScreen,
  DailyAccrualReportScreen,
  MonthlyInterestReportScreen,
  RepaymentReportScreen,
  InvoiceOutstandingReportScreen,
  LoanStatusReportScreen,
  AllProductOutstandingReportScreen,
  UtilizationReportScreen,
} from '@screens/index';

const Drawer = createDrawerNavigator<HomeNavigatorType>();

export const HomeNavigator = () => {
  const dispatch = useDispatch();
  const canViewReports = useHasPermission(PERMISSIONS.REPORTING_ANALYSIS);
  const initialRoute = 'InvoiceDashboard';

  // Pre-load user scope and permissions when entering home.
  // Scope saga re-syncs active product when a program is already selected.
  useEffect(() => {
    dispatch(fetchUserScopeRequest());
    dispatch(fetchPermissionsRequest());
  }, [dispatch]);

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
      initialRouteName={initialRoute}
      drawerContent={DrawerContent}>
      <Drawer.Screen name="InvoiceDashboard" component={InvoiceDashboard} />
      <Drawer.Screen name="InvoiceDetails" component={InvoiceDetails} />
      <Drawer.Screen name="CreateInvoice" component={CreateInvoice} />
      <Drawer.Screen name="UploadInvoiceList" component={UploadInvoiceList} />
      <Drawer.Screen name="DealerInvoiceList" component={DealerInvoiceList} />

      <Drawer.Screen name="FundingLimitsForDealers" component={FundingLimitsForDealers} />
      <Drawer.Screen name="ANCreditAccount" component={ANCreditAccount} />
      <Drawer.Screen name="CreditAccountDetails" component={CreditAccountDetails} />
      <Drawer.Screen name="CreditAccountInvoiceNumber" component={CreditAccountInvoiceNumber} />
      <Drawer.Screen name="CreditAccountDailyInterest" component={CreditAccountDailyInterest} />
      <Drawer.Screen name="FinancingRequestScreen" component={FinancingRequestScreen} />
      <Drawer.Screen name="LimitDetailsScreen" component={LimitDetailsScreen} />
      <Drawer.Screen name="DealerMakerDashboardScreen" component={DealerMakerDashboardScreen} />
      <Drawer.Screen name="ODDetailsScreen" component={ODDetailsScreen} />
      <Drawer.Screen name="ODRepaymentsScreen" component={ODRepaymentsScreen} />
      <Drawer.Screen name="AnchorsListScreen" component={AnchorsListScreen} />
      <Drawer.Screen name="InvoiceDetailView" component={InvoiceDetailView} />
      <Drawer.Screen name="InvoiceUploadPreview" component={InvoiceUploadPreview} />
      <Drawer.Screen name="DealerInvoiceDetailsScreen" component={DealerInvoiceDetailsScreen} />
      <Drawer.Screen name="DisbursementScreen" component={DisbursementScreen} />
      <Drawer.Screen name="InterestAccrualsScreen" component={InterestAccrualsScreen} />
      <Drawer.Screen
        name="InvoiceDailyInterestScreen"
        component={InvoiceDailyInterestScreen}
      />
      <Drawer.Screen name="RepaymentSettlementScreen" component={RepaymentSettlementScreen} />
      <Drawer.Screen name="DPDPenalInterestNPAScreen" component={DPDPenalInterestNPAScreen} />
      <Drawer.Screen name="StatementOfAccount" component={StatementOfAccount} />
      <Drawer.Screen name="SOADealerList" component={SOADealerList} />
      <Drawer.Screen name="OcrInvoice" component={OcrInvoiceScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="SelectProgramScreen" component={SelectProgramScreen} />
      {canViewReports ? (
        <>
          <Drawer.Screen name="AllLoanReportScreen" component={AllLoanReportScreen} />
          <Drawer.Screen
            name="DisbursementReportScreen"
            component={DisbursementReportScreen}
          />
          <Drawer.Screen name="DpdReportScreen" component={DpdReportScreen} />
          <Drawer.Screen
            name="DailyAccrualReportScreen"
            component={DailyAccrualReportScreen}
          />
          <Drawer.Screen
            name="MonthlyInterestReportScreen"
            component={MonthlyInterestReportScreen}
          />
          <Drawer.Screen
            name="RepaymentReportScreen"
            component={RepaymentReportScreen}
          />
          <Drawer.Screen
            name="InvoiceOutstandingReportScreen"
            component={InvoiceOutstandingReportScreen}
          />
          <Drawer.Screen
            name="LoanStatusReportScreen"
            component={LoanStatusReportScreen}
          />
          <Drawer.Screen
            name="AllProductOutstandingReportScreen"
            component={AllProductOutstandingReportScreen}
          />
          <Drawer.Screen
            name="UtilizationReportScreen"
            component={UtilizationReportScreen}
          />
        </>
      ) : null}
    </Drawer.Navigator>
  );
};
