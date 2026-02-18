import React, {useState, useMemo, useEffect, useCallback} from 'react';
import {View, Alert, Dimensions} from 'react-native';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {fetchInvoiceListRequest} from '@store/invoice/inv.slice';
import {
  selectInvoiceList,
  selectInvoiceListLoading,
  selectInvoiceListError,
} from '@store/invoice/inv.selector';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {mapApiToRow} from './types';
import type {InvoiceRow} from './types';

export function useInvoiceDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const programSelection = useSelector(selectProgramSelection);
  const invoiceListRaw = useSelector(selectInvoiceList);
  const invoiceListLoading = useSelector(selectInvoiceListLoading);
  const invoiceListError = useSelector(selectInvoiceListError);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  
  // Route params: from Invoice Overview (bank/dealer/program breadcrumb) or from drawer (All Program breadcrumb)
  const routeParams = route.params as {
    fromInvoiceDashboard?: boolean;
    bankName?: string;
    dealerName?: string;
    programName?: string;
  } | undefined;
  const selectedDealerName = routeParams?.dealerName;
  const fromInvoiceDashboard = routeParams?.fromInvoiceDashboard === true;
  const breadcrumbBank = routeParams?.bankName;
  const breadcrumbDealer = routeParams?.dealerName;
  const breadcrumbProgram = routeParams?.programName;

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const showAllProgramBreadcrumb = useMemo(() => {
    const programCount = appliedFilters['Program']?.length ?? 0;
    const bankCount = appliedFilters['Bank']?.length ?? 0;
    return programCount > 1 || bankCount > 1;
  }, [appliedFilters]);

  const isAnchorMaker = userRole === 'anchor_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';

  const dealerListTitle = 'Invoices';

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showSendForApprovalModal, setShowSendForApprovalModal] = useState(false);

  const programId = programSelection?.programId;

  const apiFilters = useMemo(() => {
    const inv = appliedFilters['Invoice Status'];
    const appr = appliedFilters['Approval Status'];
    const body: {byInvoiceStatus?: string[]; byApprovalStatus?: string[]} = {};
    if (inv?.length) body.byInvoiceStatus = inv;
    if (appr?.length) body.byApprovalStatus = appr;
    return Object.keys(body).length ? body : undefined;
  }, [appliedFilters]);

  useEffect(() => {
    if (programId) {
      dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
    }
  }, [programId, apiFilters, dispatch]);

  const invoiceData = useMemo(
    () => invoiceListRaw.map(mapApiToRow),
    [invoiceListRaw],
  );

  // Summary metrics for Invoice List & Approval (match design: Dealers, Total Invoices, Amount, Pending, Approved, Rejected)
  const summaryStats = useMemo(() => {
    const dealers = new Set(invoiceData.map(r => r.dealerName)).size;
    const total = invoiceData.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    invoiceData.forEach(r => {
      const a = (r.approvalStatus || '').toLowerCase();
      const s = (r.invoiceStatus || '').toLowerCase();
      if (a.includes('reject') || s.includes('reject')) rejected += 1;
      else if (a.includes('approval_complete') || a.includes('approved') || a.includes('complete')) approved += 1;
      else pending += 1;
    });
    return {
      dealers,
      totalInvoices: total,
      totalInvoiceAmount: '₹ 20,000,000.00', // placeholder until API provides amount
      pendingInvoices: pending,
      approvedInvoices: approved,
      rejectedInvoices: rejected,
    };
  }, [invoiceData]);

  const filteredData = useMemo(() => {
    let data = invoiceData;
    
    // Filter by dealerName if provided (from Summary tab click)
    // Use flexible matching (includes) to handle slight variations in dealer name
    // Only filter if we have invoice data, otherwise show all invoices
    if (selectedDealerName && invoiceData.length > 0) {
      const dealerNameLower = selectedDealerName.toLowerCase().trim();
      const filteredByDealer = data.filter(item => {
        const itemDealerName = item.dealerName?.toLowerCase().trim() || '';
        const itemDealerCode = item.dealerCode?.toLowerCase().trim() || '';
        // Match by dealer name or dealer code (flexible matching)
        return itemDealerName.includes(dealerNameLower) || 
               dealerNameLower.includes(itemDealerName) ||
               itemDealerCode.includes(dealerNameLower) ||
               dealerNameLower.includes(itemDealerCode);
      });
      
      // Only apply dealer filter if we get results, otherwise show all invoices
      // This ensures list shows invoices like before when dealerName doesn't match
      if (filteredByDealer.length > 0) {
        data = filteredByDealer;
      }
    }
    
    // Apply search text filter
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          (item.dealerName?.toLowerCase() || '').includes(term) ||
          (item.dealerCode?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term),
      );
    }
    
    return data;
  }, [invoiceData, searchText, selectedDealerName]);

  const handleMenuToggle = (invoiceId: string) => {
    if (openMenuId === invoiceId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }
    const ref = menuButtonRefs.current[invoiceId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(invoiceId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(invoiceId);
    }
  };

  const handleMenuAction = (action: string, invoiceId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    const invoiceNo =
      filteredData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceId;

    switch (action) {
      case 'edit':
        (navigation as any).navigate('CreateInvoice', {
          invoiceId,
          invoiceNo,
          mode: 'edit',
        });
        break;
      case 'checkerApproval':
        setSelectedInvoiceId(invoiceId);
        setShowCheckerApprovalModal(true);
        break;
      case 'recreateInvoice':
        (navigation as any).navigate('CreateInvoice', {
          invoiceId,
          invoiceNo,
          mode: 'recreate',
        });
        break;
      case 'approvalHistory':
        setSelectedInvoiceId(invoiceId);
        setShowCheckerApprovalModal(true);
        break;
      case 'delete':
        Alert.alert(
          'Delete Invoice',
          'Are you sure you want to delete this invoice?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                console.log('Delete invoice:', invoiceId);
              },
            },
          ],
        );
        break;
      case 'approveReject':
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setShowApproveRejectModal(true);
        break;
      case 'attachment':
        setSelectedInvoiceId(invoiceId);
        setShowAttachmentModal(true);
        break;
      case 'print':
        console.log('Print invoice:', invoiceId, invoiceNo);
        // TODO: Implement print functionality
        break;
      case 'payMeEarly':
        console.log('Pay me Early for invoice:', invoiceId);
        break;
    }
  };

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    if (file && selectedInvoiceId) {
      console.log('Upload attachment for invoice:', selectedInvoiceId, file.name);
    }
    setShowAttachmentModal(false);
    setSelectedInvoiceId(null);
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId],
    );
  };

  const selectedRowsForModal = useMemo(
    () => invoiceData.filter(row => selectedInvoiceIds.includes(row.id)),
    [invoiceData, selectedInvoiceIds],
  );

  const allSelectedOnScreen = useMemo(
    () =>
      (isDealerChecker || isAnchorChecker) &&
      filteredData.length > 0 &&
      filteredData.every(row => selectedInvoiceIds.includes(row.id)),
    [filteredData, selectedInvoiceIds, isDealerChecker, isAnchorChecker],
  );

  const toggleSelectAllVisible = () => {
    if (!isDealerChecker && !isAnchorChecker) return;
    const visibleIds = filteredData.map(row => row.id);
    if (allSelectedOnScreen) {
      setSelectedInvoiceIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedInvoiceIds(prev =>
        Array.from(new Set([...prev, ...visibleIds])),
      );
    }
  };

  const onApproveRejectApprove = (invoiceId: string) => {
    setShowApproveRejectModal(false);
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
    const invNo = selectedInvoiceNo || invoiceId;
    (navigation as any).navigate('InvoiceDetailView', {
      invoiceId,
      invoiceNo: invNo,
    });
    if (programId) {
      dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
    }
  };

  const onApproveRejectReject = () => {
    if (programId) {
      dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
    }
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
  };

  const onBulkApply = (action: 'approve' | 'reject' | 'verify' | 'cancel') => {
    // TODO: Call API to apply bulk action (approve/reject/verify/cancel) to selectedInvoiceIds
    console.log('Bulk apply:', action, selectedInvoiceIds);
    setShowSendForApprovalModal(false);
    setSelectedInvoiceIds([]);
    if (programId) {
      dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
    }
  };

  const getMenuPosition = useCallback(
    (anchor: {x: number; y: number; width: number; height: number} | null) => {
      const screen = Dimensions.get('window');
      const menuWidth = scaleWidth(180);
      const horizontalPadding = scaleWidth(12);
      const topPadding = scaleHeight(8);
      if (!anchor) {
        return {
          position: 'absolute' as const,
          top: topPadding + scaleHeight(60),
          right: horizontalPadding,
        };
      }
      const desiredLeft = anchor.x + anchor.width - menuWidth;
      const left = Math.max(
        horizontalPadding,
        Math.min(desiredLeft, screen.width - menuWidth - horizontalPadding),
      );
      const top = Math.max(topPadding, anchor.y + anchor.height + scaleHeight(6));
      return {position: 'absolute' as const, top, left};
    },
    [],
  );

  return {
    programId,
    programName: programSelection?.programName ?? null,
    summaryStats,
    apiFilters,
    dispatch,
    navigation,
    invoiceData,
    filteredData,
    invoiceListLoading,
    invoiceListError,
    isAnchorMaker,
    isAnchorChecker,
    isDealerMaker,
    isDealerChecker,
    dealerListTitle,
    selectedDealerName,
    fromInvoiceDashboard,
    searchText,
    setSearchText,
    showFilterModal,
    setShowFilterModal,
    appliedFilters,
    setAppliedFilters,
    openMenuId,
    setOpenMenuId,
    setMenuAnchor,
    menuAnchor,
    menuButtonRefs,
    showCheckerApprovalModal,
    setShowCheckerApprovalModal,
    showApproveRejectModal,
    setShowApproveRejectModal,
    selectedInvoiceId,
    setSelectedInvoiceId,
    selectedInvoiceNo,
    setSelectedInvoiceNo,
    showAttachmentModal,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    showSendForApprovalModal,
    setShowSendForApprovalModal,
    selectedRowsForModal,
    allSelectedOnScreen,
    fromInvoiceDashboard,
    breadcrumbBank,
    breadcrumbDealer,
    breadcrumbProgram,
    showAllProgramBreadcrumb,
    handleMenuToggle,
    handleMenuAction,
    handleAttachmentUpload,
    toggleInvoiceSelection,
    toggleSelectAllVisible,
    onApproveRejectApprove,
    onApproveRejectReject,
    onBulkApply,
    getMenuPosition,
  };
}
