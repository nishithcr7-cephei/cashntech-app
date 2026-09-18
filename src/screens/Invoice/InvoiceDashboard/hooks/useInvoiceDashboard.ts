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
  selectInvoiceOverviewSummaryError,
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
import {getBestWorkflowApprovalLevelFromScope, getInvoiceApprovalLevelForId} from '@utils/getInvoiceApprovalLevel';
import {selectActiveProductCode, selectActiveProductName, selectActiveProductId} from '@store/product/product.selectors';
import {PRODUCT_DISPLAY_NAMES} from '@store/product/product.types';
import {getEffectiveProductCode, resolveWorkspaceProductId} from '@store/product/product.resolver';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import type {Bank} from '@constants/programSelection';
import type {ProductTabType} from '../types';
import {getProgramIdsForTab, productTabFromCode} from '../utils/dashboardUtils';
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
  const activeProductCode = useSelector(selectActiveProductCode);
  const activeProductName = useSelector(selectActiveProductName);
  const activeProductId = useSelector(selectActiveProductId);
  const summaryData = useSelector(selectInvoiceOverviewSummary);
  const summaryLoading = useSelector(selectInvoiceOverviewSummaryLoading);
  const summaryError = useSelector(selectInvoiceOverviewSummaryError);
  const latestData = useSelector(selectInvoiceOverviewLatest);
  const latestLoading = useSelector(selectInvoiceOverviewLatestLoading);
  const kpis = useSelector(selectInvoiceOverviewKpis);
  const kpisLoading = useSelector(selectInvoiceOverviewKpisLoading);

  // Role-based visibility flags
  const isAnchorAllAccess = userRole === 'anchor_all_access';
  const isDealerAllAccess = userRole === 'dealer_all_access';
  const isAnchorMaker = userRole === 'anchor_maker' || isAnchorAllAccess;
  const isDealerMaker = userRole === 'dealer_maker' || isDealerAllAccess;
  const isAnchorChecker = userRole === 'anchor_checker' || isAnchorAllAccess;
  const isDealerChecker = userRole === 'dealer_checker' || isDealerAllAccess;
  const checkerRoleContext = {
    isAnchorChecker,
    isDealerMaker,
    isDealerChecker,
  };
  const isCashnTechUser = !!(
    userRole === 'cashntech_user' ||
    (userRole && ROLE_LABELS[userRole] === 'CashnTech User')
  );

  const [activeTab, setActiveTab] = useState<'dealers' | 'unpaid'>('dealers');
  const effectiveCode = getEffectiveProductCode(activeProductCode);
  const [productTab, setProductTab] = useState<ProductTabType>(() =>
    productTabFromCode(effectiveCode),
  );

  // Keep productTab in sync when the active product changes via the in-app
  // switcher. Without this, productTab only reflects the product at mount.
  useEffect(() => {
    setProductTab(prev =>
      prev === 'all_product' ? prev : productTabFromCode(effectiveCode),
    );
  }, [effectiveCode]);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedDealerNo, setSelectedDealerNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // Bulk Action states
  const [selectedInvoices, setSelectedInvoices] = useState<BulkInvoiceItem[]>([]);
  const [showBulkReviewModal, setShowBulkReviewModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'Verify' | 'Approve' | 'Reject' | 'On Hold'>('Verify');
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

  const overviewProductId = useMemo(
    () => resolveWorkspaceProductId(programSelection, activeProductId),
    [programSelection, activeProductId],
  );

  const productBreadcrumbLabel = useMemo(() => {
    if (activeProductName) {return activeProductName;}
    return PRODUCT_DISPLAY_NAMES[effectiveCode];
  }, [activeProductName, effectiveCode]);

  const programIds = useMemo(() => {
    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.programId
    ) {
      return [programSelection.programId];
    }

    // "All Program" / default: always active-product-scoped — never DF+VF+PID mixed.
    const activeProductTab = productTabFromCode(effectiveCode);
    const tabForFetch =
      productTab === 'all_product' ? activeProductTab : productTab;

    if (
      programSelection?.programScope === 'all' &&
      allProgramIds &&
      allProgramIds.length > 0
    ) {
      // allProgramIds selector is already filtered to active product.
      if (tabForFetch === activeProductTab) {
        return allProgramIds;
      }
      return getProgramIdsForTab(tabForFetch, scopeData);
    }
    return getProgramIdsForTab(tabForFetch, scopeData);
  }, [
    productTab,
    scopeData,
    programSelection?.programScope,
    programSelection?.programId,
    allProgramIds,
    effectiveCode,
  ]);

  useEffect(() => {
    if (!scopeData || scopeData.length === 0) {
      dispatch(fetchUserScopeRequest());
    }
  }, [dispatch, scopeData]);

  useEffect(() => {
    if (!scopeData || scopeData.length === 0) {return;}
    if (
      programSelection?.programScope === 'selected' &&
      programIds.length === 0
    ) {
      return;
    }
    // Same guard as invoice list: KPI/summary/latest need productId
    // (HTTP 400 without it). Skip until workspace product is resolved.
    if (!overviewProductId && programIds.length === 0) {
      return;
    }

    dispatch(fetchInvoiceSummaryRequest({programIds, productId: overviewProductId}));
    dispatch(fetchLatestInvoicesRequest({programIds, productId: overviewProductId}));
    dispatch(fetchInvoiceKpisRequest({programIds, productId: overviewProductId}));
  }, [dispatch, programIds, scopeData, programSelection?.programScope, productTab, overviewProductId]);

  useEffect(() => {
    if (!summaryError) {
      return;
    }
    Toast.show({
      type: 'error',
      text1: 'Invoice summary',
      text2: summaryError,
    });
  }, [summaryError]);

  const handleBulkAction = useCallback((action: 'Verify' | 'Approve' | 'Reject' | 'On Hold') => {
    setBulkAction(action);
    setShowBulkReviewModal(true);
  }, []);

  const onBulkSubmit = async (payload: {
    action: 'Verify' | 'Approve' | 'Reject' | 'On Hold';
    invoices: {
      invoiceId: string;
      action: string;
      remark: string;
      approvalRemark?: string;
    }[];
  }) => {
    if (payload.invoices.length === 0) {return;}

    setBulkLoading(true);
    try {
      const isChecker = isAnchorChecker || isDealerChecker;
      let response: any;

      if (isChecker) {
        const workflowLevelFromScope =
          getBestWorkflowApprovalLevelFromScope(scopeData, {
            productId: programSelection?.productId,
            programId: programSelection?.programId,
          }) ?? programSelection?.approvalLevel ?? null;

        const lookupApprovalStatus = (invoiceId: string) => {
          const fromLatest = (latestData as {id?: string; approval_status?: string}[]).find(
            r => r.id === invoiceId,
          )?.approval_status;
          if (fromLatest) {return fromLatest;}
          const fromSelection = selectedInvoices.find(inv => inv.id === invoiceId) as
            | {rawApprovalStatus?: string}
            | undefined;
          return fromSelection?.rawApprovalStatus;
        };

        const checkerPayload = {
          action: (payload.action === 'Approve' ? 'Approve' : 'Reject') as 'Approve' | 'Reject',
          invoices: payload.invoices.map(inv => ({
            invoiceId: inv.invoiceId,
            action: inv.action === 'Approve' ? 'Approve' : 'Reject',
            approval_level: getInvoiceApprovalLevelForId(
              inv.invoiceId,
              lookupApprovalStatus,
              checkerRoleContext,
              workflowLevelFromScope,
            ),
            remark: inv.remark,
          })),
        };
        response = await invoiceApi.bulkUpdateInvoiceStatus(checkerPayload);
      } else {
        // Admin Bulk Verification API (Verify/Reject/Hold)
        response = await invoiceApi.bulkUpdateInvoiceVerification(payload as any);
      }

      if (response) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Successfully processed ${payload.invoices.length} invoices`,
        });
        setSelectedInvoices([]);
        setShowBulkReviewModal(false);
        // Refresh data
        dispatch(fetchLatestInvoicesRequest({programIds, productId: overviewProductId}));
        dispatch(fetchInvoiceSummaryRequest({programIds, productId: overviewProductId}));
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
    summaryError,
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
    productBreadcrumbLabel,
    overviewProductId,
    activeProductCode,
  };
};
