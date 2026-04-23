import {useState, useEffect, useMemo, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {DrawerNavigationProp} from '@react-navigation/drawer';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import {userSelector} from '@store/user';
import {AppRole, ROLE_LABELS} from '@constants/roles';
import {
  selectScopeData,
  selectProgramSelection,
  selectAllProgramIds,
} from '@store/programSelection/programSelection.selector';
import {fetchUserScopeRequest} from '@store/programSelection/programSelection.slice';
import {
  fetchInvoiceSummaryRequest,
  fetchLatestInvoicesRequest,
  selectInvoiceOverviewSummary,
  selectInvoiceOverviewSummaryLoading,
  selectInvoiceOverviewLatest,
  selectInvoiceOverviewLatestLoading,
  fetchInvoiceKpisRequest,
  selectInvoiceOverviewKpis,
  selectInvoiceOverviewKpisLoading,
} from '@store/invoiceOverview';
import {selectPermissionsLoading} from '@store/permissions';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {invoiceApi} from '@services/api/invoice.api';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import type {Bank} from '@constants/programSelection';
import type {ProductTabType} from '../types';
import {getProgramIdsForTab} from '../utils/dashboardUtils';
import type {BulkInvoiceItem} from '@components/index';

export const useInvoiceDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const scopeData = useSelector(selectScopeData) as Bank[] | null;
  const programSelection = useSelector(selectProgramSelection);
  const allProgramIds = useSelector(selectAllProgramIds);
  const summaryData = useSelector(selectInvoiceOverviewSummary);
  const summaryLoading = useSelector(selectInvoiceOverviewSummaryLoading);
  const latestData = useSelector(selectInvoiceOverviewLatest);
  const latestLoading = useSelector(selectInvoiceOverviewLatestLoading);
  const kpis = useSelector(selectInvoiceOverviewKpis);
  const kpisLoading = useSelector(selectInvoiceOverviewKpisLoading);

  // Role-based visibility flags
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCashnTechUser = !!(
    userRole === 'cashntech_user' || 
    (userRole && ROLE_LABELS[userRole] === 'CashnTech User')
  );

  const [activeTab, setActiveTab] = useState<'dealers' | 'unpaid'>('dealers');
  const [productTab, setProductTab] = useState<ProductTabType>('all_product');
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedDealerNo, setSelectedDealerNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // Bulk Action states
  const [selectedInvoices, setSelectedInvoices] = useState<BulkInvoiceItem[]>([]);
  const [showBulkReviewModal, setShowBulkReviewModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'Verify' | 'Reject' | 'On Hold'>('Verify');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Permissions
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canEdit = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const canDelete = useHasPermission(PERMISSIONS.INVOICE_LIST_DELETE);
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canAttachment = useHasPermission(PERMISSIONS.INVOICE_LIST_ATTACHMENT);
  const canPrint = useHasPermission(PERMISSIONS.INVOICE_LIST_PRINT);
  const canViewApprovalHistory = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVAL_HISTORY);

  const canShowApproveReject = canApprove || canReject;

  const programIds = useMemo(() => {
    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.programId
    ) {
      return [programSelection.programId];
    }
    if (
      programSelection?.programScope === 'all' &&
      allProgramIds &&
      allProgramIds.length > 0
    ) {
      if (productTab === 'all_product') {
        return allProgramIds;
      }
      return getProgramIdsForTab(productTab, scopeData);
    }
    return getProgramIdsForTab(productTab, scopeData);
  }, [
    productTab,
    scopeData,
    programSelection?.programScope,
    programSelection?.programId,
    allProgramIds,
  ]);

  useEffect(() => {
    if (!scopeData || scopeData.length === 0) {
      dispatch(fetchUserScopeRequest());
    }
  }, [dispatch, scopeData]);

  useEffect(() => {
    if (!scopeData || scopeData.length === 0) return;
    if (
      programSelection?.programScope === 'selected' &&
      programIds.length === 0
    ) {
      return;
    }

    dispatch(fetchInvoiceSummaryRequest({programIds: programIds}));
    dispatch(fetchLatestInvoicesRequest({programIds: programIds}));
    dispatch(fetchInvoiceKpisRequest({programIds: programIds}));
  }, [dispatch, programIds, scopeData, programSelection?.programScope, productTab]);

  const handleBulkAction = useCallback((action: 'Verify' | 'Reject' | 'On Hold') => {
    setBulkAction(action);
    setShowBulkReviewModal(true);
  }, []);

  const onBulkSubmit = async (payload: {
    action: 'Verify' | 'Reject' | 'On Hold';
    invoices: {
      invoiceId: string;
      action: string;
      remark: string;
      approvalRemark?: string;
    }[];
  }) => {
    if (payload.invoices.length === 0) return;
    
    setBulkLoading(true);
    try {
      const response = await invoiceApi.bulkUpdateInvoiceVerification(payload);
      
      if (response) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Successfully processed ${payload.invoices.length} invoices`,
        });
        setSelectedInvoices([]);
        setShowBulkReviewModal(false);
        // Refresh data
        dispatch(fetchLatestInvoicesRequest({programIds: programIds}));
        dispatch(fetchInvoiceSummaryRequest({programIds: programIds}));
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || `Failed to ${payload.action.toLowerCase()} invoices`,
      });
    } finally {
      setBulkLoading(false);
    }
  };

  return {
    dispatch,
    navigation,
    userRole,
    summaryData,
    summaryLoading,
    latestData,
    latestLoading,
    kpis,
    kpisLoading,
    isAnchorMaker,
    isDealerMaker,
    isAnchorChecker,
    isDealerChecker,
    isCashnTechUser,
    activeTab,
    setActiveTab,
    productTab,
    setProductTab,
    showCheckerApprovalModal,
    setShowCheckerApprovalModal,
    showApproveRejectModal,
    setShowApproveRejectModal,
    selectedDealerId,
    setSelectedDealerId,
    selectedDealerNo,
    setSelectedDealerNo,
    showAttachmentModal,
    setShowAttachmentModal,
    selectedInvoices,
    setSelectedInvoices,
    showBulkReviewModal,
    setShowBulkReviewModal,
    bulkAction,
    bulkLoading,
    permissionsLoading,
    canEdit,
    canDelete,
    canApprove,
    canReject,
    canAttachment,
    canPrint,
    canViewApprovalHistory,
    canShowApproveReject,
    programIds,
    handleBulkAction,
    onBulkSubmit,
  };
};
