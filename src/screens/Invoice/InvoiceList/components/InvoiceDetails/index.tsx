import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  AppBar,
  CheckerApprovalModal,
  ApproveRejectModal,
  Container,
  FilterModal,
  InvoiceAttachmentsModal,
  ProgramBreadcrumb,
  BulkReviewModal,
} from '@components/index';
import {BulkActionSheet} from './BulkActionSheet';
import {Colors} from '@constants/index';
import {LeftChevron} from '@assets/Icons';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {useInvoiceDetails} from './useInvoiceDetails';
import {InvoiceDetailsControls} from './InvoiceDetailsControls';
import {InvoiceDetailsCard} from './InvoiceDetailsCard';
import {SendForApprovalModal} from './SendForApprovalModal';
import {InvoiceActionMenuModal} from './InvoiceActionMenuModal';
import {styles} from './InvoiceDetails.styles';
import {invoiceApi} from '@services/api/invoice.api';
import Toast from 'react-native-toast-message';

export const InvoiceDetails: React.FC = () => {
  const {
    programId,
    programName,
    navigation,
    invoiceData,
    filteredData,
    paginatedData,
    hasMore,
    loadMore,
    invoiceListLoading,
    invoiceListError,
    isDealerMaker,
    isAnchorMaker,
    isAnchorChecker,
    isDealerChecker,
    isCashnTechUser,
    dealerListTitle,
    selectedDealerName,
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
    approvalHistoryEntries,
    approvalHistoryLoading,
    setApprovalHistoryLoading,
    showApproveRejectModal,
    setShowApproveRejectModal,
    selectedInvoiceId,
    setSelectedInvoiceId,
    selectedInvoiceNo,
    setSelectedInvoiceNo,
    selectedInvoiceDetails,
    anchorCheckerInvoiceDetails,
    anchorCheckerDetailsLoading,
    showAttachmentModal,
    setShowAttachmentModal,
    selectedInvoiceIds,
    showSendForApprovalModal,
    setShowSendForApprovalModal,
    selectedRowsForModal,
    allSelectedOnScreen,
    fromInvoiceDashboard,
    handleMenuToggle,
    handleMenuAction,
    handleInvoiceNoPress,
    refreshInvoiceList,
    toggleInvoiceSelection,
    toggleSelectAllVisible,
    onApproveRejectApprove,
    onApproveRejectReject,
    onVerifyApprove,
    onVerifyReject,
    onBulkApply,
    getMenuPosition,
    onCreateInvoicePress,
    isCreateInvoiceEnabled,
    hasAnyProgramContext,
    invoiceFilterData,
    showAllProgramBreadcrumb,
    selectedInvoiceRawAdminStatus,
    selectedInvoiceRawApprovalStatus,
    selectedInvoiceRawInvoiceStatus,
    selectedInvoiceApprovalLogsCount,
    userDepartment,
    storedUserRole,
    userInfoFull,
    pendingCount,
    draftCount,
    selectedInvoices,
    setSelectedInvoices,
    bulkAction,
    setBulkAction,
    showBulkReviewModal,
    setShowBulkReviewModal,
    handleBulkAction,
    bulkLoading,
    setBulkLoading,
    setSelectedInvoiceIds,
  } = useInvoiceDetails();

  const [showBulkActionSheet, setShowBulkActionSheet] = React.useState(false);

  // Automatically trigger action sheet when invoices are selected (CashnTech only)
  const prevCount = React.useRef(selectedInvoiceIds.length);
  React.useEffect(() => {
    if (isCashnTechUser && selectedInvoiceIds.length > prevCount.current && selectedInvoiceIds.length > 0) {
      setShowBulkActionSheet(true);
    }
    prevCount.current = selectedInvoiceIds.length;
  }, [selectedInvoiceIds.length, isCashnTechUser]);

  const registerMenuRef = (id: string, ref: View | null) => {
    menuButtonRefs.current[id] = ref;
  };

  return (
    <Container>
      <AppBar
        title="Transactions > Invoice List & Approval"
        navigation={navigation as any}
        hideHamburger={(isAnchorMaker || isDealerMaker || isCashnTechUser) && fromInvoiceDashboard}
        renderLeftIcon={fromInvoiceDashboard ? <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} /> : undefined}
        onPressLeftIcon={fromInvoiceDashboard ? () => navigation.goBack() : undefined}
        style={{zIndex: 10}}
      />
      <ProgramBreadcrumb />
      {/* Removed Selected Program Row as requested */}
      {!hasAnyProgramContext ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Select a program first to view invoice list.
            </Text>
          </View>
        </ScrollView>
      ) : invoiceListError ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.errorStateText}>{invoiceListError}</Text>
          </View>
        </ScrollView>
      ) : (
        <>
          <FlatList
            style={styles.scroll}
            contentContainerStyle={styles.content}
            data={paginatedData}
            keyExtractor={row => row.id}
            ListHeaderComponent={
              <>
                <InvoiceDetailsControls
                  dealerListTitle={dealerListTitle}
                  invoiceCount={invoiceData.length}
                  isDealerMaker={isDealerMaker}
                  isAnchorMaker={isAnchorMaker}
                  isAnchorChecker={isAnchorChecker}
                  isDealerChecker={isDealerChecker}
                  isCashnTechUser={isCashnTechUser}
                  filteredDataLength={filteredData.length}
                  searchText={searchText}
                  setSearchText={setSearchText}
                  onOpenFilterModal={() => setShowFilterModal(true)}
                  navigation={navigation}
                  allSelectedOnScreen={allSelectedOnScreen}
                  onToggleSelectAllVisible={toggleSelectAllVisible}
                  selectedInvoiceIdsLength={selectedInvoiceIds.length}
                  onOpenSendForApprovalModal={() => setShowSendForApprovalModal(true)}
                  onCreateInvoicePress={onCreateInvoicePress}
                  isCreateInvoiceEnabled={isCreateInvoiceEnabled}
                  user={userInfoFull}
                  actionRequiredCount={invoiceData.filter(r => r.rawInvoiceStatus?.toLowerCase() === 'rejected').length}
                  pendingCount={pendingCount}
                  draftCount={draftCount}
                  onBulkAction={handleBulkAction}
                />
                <View style={styles.listTopSeparator} />
              </>
            }
            ItemSeparatorComponent={() => <View style={{height: scaleHeight(12)}} />}
            renderItem={({item: row, index}) => (
              <InvoiceDetailsCard
                row={row}
                index={index}
                isAnchorMaker={isAnchorMaker}
                isDealerMaker={isDealerMaker}
                isDealerChecker={isDealerChecker}
                isAnchorChecker={isAnchorChecker}
                isCashnTechUser={isCashnTechUser}
                storedUserRole={storedUserRole}
                transparency={invoiceListLoading ? 0.6 : 1}
                isSelected={(isDealerChecker || isAnchorChecker || isCashnTechUser) && selectedInvoiceIds.includes(row.id)}
                onMenuToggle={handleMenuToggle}
                onToggleSelection={toggleInvoiceSelection}
                onInvoiceNoPress={handleInvoiceNoPress}
                registerMenuRef={registerMenuRef}
              />
            )}
            ListEmptyComponent={
              !invoiceListLoading && filteredData.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    {selectedDealerName
                      ? `No invoices found for ${selectedDealerName}`
                      : 'No invoices found'}
                  </Text>
                </View>
              ) : null
            }
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.3}
            onScrollBeginDrag={() => {
              setOpenMenuId(null);
              setMenuAnchor(null);
            }}
            ListFooterComponent={
              hasMore && !invoiceListLoading ? (
                <View style={styles.loadMoreFooter}>
                  <ActivityIndicator size="small" color={Colors.primaryColor} />
                  <Text style={styles.loadMoreText}>Loading more...</Text>
                </View>
              ) : null
            }
          />
          {invoiceListLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.overlaySpinnerContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.overlayLoadingText}>Loading Invoices...</Text>
              </View>
            </View>
          )}
        </>
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
        }}
        filterData={invoiceFilterData}
        appliedFilters={appliedFilters}
      />

      <CheckerApprovalModal
        visible={showCheckerApprovalModal}
        onClose={() => {
          setShowCheckerApprovalModal(false);
          setSelectedInvoiceId(null);
          setApprovalHistoryLoading(false);
        }}
        approvalEntries={approvalHistoryEntries}
        loading={approvalHistoryLoading}
        invoiceNo={selectedInvoiceNo || undefined}
      />

      <ApproveRejectModal
        visible={showApproveRejectModal}
        invoiceId={selectedInvoiceId}
        invoiceNo={selectedInvoiceNo || undefined}
        variant={
          isCashnTechUser
            ? 'cashntech_verification'
            : isAnchorChecker
              ? 'anchor_checker'
              : 'default'
        }
        invoiceDetails={
          isCashnTechUser || isAnchorChecker
            ? anchorCheckerInvoiceDetails ?? undefined
            : selectedInvoiceDetails
        }
        detailsLoading={(isAnchorChecker || isCashnTechUser) && anchorCheckerDetailsLoading}
        onClose={() => {
          setShowApproveRejectModal(false);
          setSelectedInvoiceId(null);
          setSelectedInvoiceNo(null);
        }}
        onApprove={(invoiceId, remarks) => {
          if (isCashnTechUser) {
            onVerifyApprove(invoiceId, remarks);
          } else {
            onApproveRejectApprove(invoiceId, remarks);
          }
        }}
        onReject={(invoiceId, remarks) => {
          if (isCashnTechUser) {
            onVerifyReject(invoiceId, remarks);
          } else {
            onApproveRejectReject(invoiceId, remarks);
          }
        }}
      />

      <InvoiceAttachmentsModal
        visible={showAttachmentModal}
        invoiceId={selectedInvoiceId}
        onClose={() => {
          setShowAttachmentModal(false);
          setSelectedInvoiceId(null);
        }}
        onListChanged={refreshInvoiceList}
      />

      <SendForApprovalModal
        visible={showSendForApprovalModal}
        onClose={() => setShowSendForApprovalModal(false)}
        selectedRows={selectedRowsForModal}
        selectedIds={selectedInvoiceIds}
        onToggleSelection={toggleInvoiceSelection}
        onApply={onBulkApply}
      />

      <InvoiceActionMenuModal
        visible={!!openMenuId}
        onClose={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}
        openMenuId={openMenuId}
        menuAnchor={menuAnchor}
        getMenuPosition={getMenuPosition}
        onMenuAction={handleMenuAction}
        isAnchorMaker={isAnchorMaker}
        isAnchorChecker={isAnchorChecker}
        isDealerMaker={isDealerMaker}
        isDealerChecker={isDealerChecker}
        isCashnTechUser={isCashnTechUser}
        rawAdminStatus={selectedInvoiceRawAdminStatus}
        rawApprovalStatus={selectedInvoiceRawApprovalStatus}
        rawInvoiceStatus={selectedInvoiceRawInvoiceStatus}
        userDepartment={userDepartment}
        approvalLogsCount={selectedInvoiceApprovalLogsCount}
      />
      {/* Floating trigger removed as requested */}

      <BulkActionSheet
        visible={showBulkActionSheet}
        onClose={() => {
          setShowBulkActionSheet(false);
        }}
        selectedCount={selectedInvoiceIds.length}
        onAction={(action) => {
          setShowBulkActionSheet(false);
          setTimeout(() => {
            handleBulkAction(action);
          }, 300);
        }}
      />

      <BulkReviewModal
        visible={showBulkReviewModal}
        onClose={() => {
          setShowBulkReviewModal(false);
          setSelectedInvoices([]);
          setSelectedInvoiceIds([]);
        }}
        selectedInvoices={selectedInvoices}
        action={bulkAction}
        onSubmit={(payload) => {
          setBulkLoading(true);
          invoiceApi.bulkUpdateInvoiceVerification(payload)
            .then(res => {
              console.log('Bulk Action API Response:', JSON.stringify(res, null, 2));
              if (res.statusCode === 200 || res.status === 200) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: `Bulk ${bulkAction} completed successfully`,
                });
                setSelectedInvoices([]);
                setSelectedInvoiceIds([]);
                setShowBulkReviewModal(false);
                refreshInvoiceList();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Action Failed',
                  text2: res.message || 'Something went wrong',
                });
              }
            })
            .catch(err => {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'An error occurred',
              });
            })
            .finally(() => setBulkLoading(false));
        }}
        loading={bulkLoading}
      />
    </Container>
  );
};
