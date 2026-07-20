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
    attachmentFallback,
    setAttachmentFallback,
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
    handleBulkReviewSubmit,
    getMenuPosition,
    onCreateInvoicePress,
    isCreateInvoiceEnabled,
    createInvoiceDisabledReason,
    hasAnyProgramContext,
    canEdit,
    canImport,
    invoiceFilterData,
    showAllProgramBreadcrumb,
    selectedInvoiceRawAdminStatus,
    selectedInvoiceRawApprovalStatus,
    selectedInvoiceRawInvoiceStatus,
    selectedInvoiceActionable,
    selectedInvoiceApprovalLogsCount,
    userDepartment,
    storedUserRole,
    userInfoFull,
    pendingCount,
    draftCount,
    actionRequiredCount,
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
    isInvoiceSelectable,
    isAnchorAllAccess,
    isDealerAllAccess,
  } = useInvoiceDetails();

  const [showBulkActionSheet, setShowBulkActionSheet] = React.useState(false);

  // Automatically trigger action sheet when invoices are selected (CashnTech and Anchor Checker)
  const prevCount = React.useRef(selectedInvoiceIds.length);
  React.useEffect(() => {
    if ((isCashnTechUser || isAnchorChecker || isDealerChecker) && selectedInvoiceIds.length > prevCount.current && selectedInvoiceIds.length > 0) {
      setShowBulkActionSheet(true);
    }
    prevCount.current = selectedInvoiceIds.length;
  }, [selectedInvoiceIds.length, isCashnTechUser, isAnchorChecker, isDealerChecker]);

  const registerMenuRef = (id: string, ref: View | null) => {
    menuButtonRefs.current[id] = ref;
  };

  return (
    <Container>
      <AppBar
        title="Transactions > Invoice List & Approval"
        navigation={navigation as any}
        hideHamburger={(isAnchorMaker || isAnchorChecker || isDealerMaker || isCashnTechUser) && fromInvoiceDashboard}
        renderLeftIcon={fromInvoiceDashboard ? <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} /> : undefined}
        onPressLeftIcon={fromInvoiceDashboard ? () => navigation.goBack() : undefined}
        style={{zIndex: 10}}
      />
      <ProgramBreadcrumb />
      <View style={styles.navPathContainer}>
        <Text style={styles.navPathText} numberOfLines={1} ellipsizeMode="tail">
          Products {'>'} Dealer Finance {'>'} Transactions
        </Text>
      </View>
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
            <TouchableOpacity
              style={styles.errorRefreshButton}
              onPress={refreshInvoiceList}
              disabled={invoiceListLoading}
              activeOpacity={0.8}>
              {invoiceListLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <FontAwesome6
                    name="arrow-rotate-right"
                    iconStyle="solid"
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.errorRefreshButtonText}>Refresh</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : invoiceListLoading && invoiceData.length === 0 ? (
        <View style={styles.fullScreenLoading}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.loadingText}>Loading Invoices...</Text>
        </View>
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
                  isAnchorAllAccess={isAnchorAllAccess}
                  isDealerAllAccess={isDealerAllAccess}
                  filteredDataLength={filteredData.length}
                  searchText={searchText}
                  setSearchText={setSearchText}
                  onOpenFilterModal={() => setShowFilterModal(true)}
                  navigation={navigation}
                  allSelectedOnScreen={allSelectedOnScreen}
                  onToggleSelectAllVisible={toggleSelectAllVisible}
                  selectedInvoiceIdsLength={selectedInvoiceIds.length}
                  onOpenSendForApprovalModal={() => setShowBulkActionSheet(true)}
                  onCreateInvoicePress={onCreateInvoicePress}
                  isCreateInvoiceEnabled={isCreateInvoiceEnabled}
                  createInvoiceDisabledReason={createInvoiceDisabledReason}
                  user={userInfoFull}
                  actionRequiredCount={actionRequiredCount}
                  pendingCount={pendingCount}
                  draftCount={draftCount}
                  onBulkAction={handleBulkAction}
                  canEdit={canEdit}
                  canImport={canImport}
                  onRefresh={refreshInvoiceList}
                  listRefreshing={invoiceListLoading}
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
                isAnchorAllAccess={isAnchorAllAccess}
                isDealerAllAccess={isDealerAllAccess}
                storedUserRole={storedUserRole}
                transparency={invoiceListLoading ? 0.6 : 1}
                isSelected={(isDealerChecker || isAnchorChecker || isCashnTechUser) && selectedInvoiceIds.includes(row.id)}
                onMenuToggle={handleMenuToggle}
                onToggleSelection={toggleInvoiceSelection}
                onInvoiceNoPress={handleInvoiceNoPress}
                registerMenuRef={registerMenuRef}
                isSelectable={isInvoiceSelectable(row)}
              />
            )}
            ListEmptyComponent={
              invoiceListLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryColor} />
                  <Text style={styles.loadingText}>Loading Invoices...</Text>
                </View>
              ) : filteredData.length === 0 ? (
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
        fallbackAttachments={attachmentFallback}
        onClose={() => {
          setShowAttachmentModal(false);
          setAttachmentFallback([]);
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
        isAnchorAllAccess={isAnchorAllAccess}
        isDealerAllAccess={isDealerAllAccess}
        rawAdminStatus={selectedInvoiceRawAdminStatus}
        rawApprovalStatus={selectedInvoiceRawApprovalStatus}
        rawInvoiceStatus={selectedInvoiceRawInvoiceStatus}
        listActionable={selectedInvoiceActionable}
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
        isAnchorChecker={isAnchorChecker}
        isDealerChecker={isDealerChecker}
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
        onSubmit={handleBulkReviewSubmit}
        loading={bulkLoading}
      />
    </Container>
  );
};
