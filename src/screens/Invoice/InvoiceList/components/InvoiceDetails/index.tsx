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
  BusyOverlay,
  SkeletonList,
} from '@components/index';
import {BulkActionSheet} from './BulkActionSheet';
import {Colors} from '@constants/index';
import {LeftChevron} from '@assets/Icons';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {useInvoiceDetails} from './useInvoiceDetails';
import {
  InvoiceDetailsControls,
  InvoiceListTitle,
} from './InvoiceDetailsControls';
import {InvoiceDetailsCard} from './InvoiceDetailsCard';
import {SendForApprovalModal} from './SendForApprovalModal';
import {InvoiceActionMenuModal} from './InvoiceActionMenuModal';
import {FinanceRequestDetailsModal} from './FinanceRequestDetailsModal';
import {NoticeOfAssignmentModal} from './NoticeOfAssignmentModal';
import {styles} from './InvoiceDetails.styles';
import {PRODUCT_CODES} from '@store/product/product.types';
import {getPartyLabels} from '@store/product/product.resolver';

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
    productBreadcrumbLabel,
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
    approvalHistorySummary,
    setApprovalHistoryLoading,
    showFinanceRequestModal,
    financeRequestPreview,
    financeRequestLoading,
    financeRequestSubmitting,
    closeFinanceRequestModal,
    submitFinanceRequest,
    showNoaModal,
    noaPreview,
    noaLoading,
    noaSubmitting,
    noaReadOnly,
    closeNoaModal,
    submitNoticeOfAssignment,
    showApproveRejectModal,
    setShowApproveRejectModal,
    selectedInvoiceId,
    setSelectedInvoiceId,
    selectedInvoiceNo,
    setSelectedInvoiceNo,
    selectedInvoiceDetails,
    anchorCheckerInvoiceDetails,
    anchorCheckerDetailsLoading,
    dueDateCalculatedFrom,
    effectiveProductCode,
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
    onVerifyHold,
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
    selectedInvoiceDeletable,
    selectedInvoiceCurrentStepActionType,
    selectedInvoiceApprovalLogsCount,
    selectedInvoiceCurrentStepSequenceNo,
    selectedInvoiceProgramMethod,
    userDepartment,
    storedUserRole,
    userInfoFull,
    pendingCount,
    pendingNoaCount,
    draftCount,
    actionRequiredCount,
    canNoticeOfAssignment,
    summaryFocus,
    onSummaryFocusChange,
    listEmptyMessage,
    summaryFocusHint,
    summaryFocusSwitching,
    summaryFocusSwitchMessage,
    selectedInvoices,
    setSelectedInvoices,
    bulkAction,
    setBulkAction,
    showBulkReviewModal,
    setShowBulkReviewModal,
    handleBulkAction,
    bulkLoading,
    setBulkLoading,
    actionBusy,
    actionBusyMessage,
    setSelectedInvoiceIds,
    isInvoiceSelectable,
    isAnchorAllAccess,
    isDealerAllAccess,
    canBulkActions,
    canUploadVerify,
    canApprove,
    canReject,
  } = useInvoiceDetails();

  const isVendorFinance =
    effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE;
  const isVfAnchorMaker = isVendorFinance && isAnchorMaker;

  const [showBulkActionSheet, setShowBulkActionSheet] = React.useState(false);

  // Automatically trigger action sheet when invoices are selected
  const prevCount = React.useRef(selectedInvoiceIds.length);
  const canOpenBulkSheet =
    (isCashnTechUser && canUploadVerify) ||
    ((isAnchorChecker || isDealerChecker || isVfAnchorMaker) &&
      canBulkActions &&
      (canApprove || canReject));

  React.useEffect(() => {
    if (
      canOpenBulkSheet &&
      selectedInvoiceIds.length > prevCount.current &&
      selectedInvoiceIds.length > 0
    ) {
      setShowBulkActionSheet(true);
    }
    prevCount.current = selectedInvoiceIds.length;
  }, [selectedInvoiceIds.length, canOpenBulkSheet]);

  const registerMenuRef = (id: string, ref: View | null) => {
    menuButtonRefs.current[id] = ref;
  };

  const breadcrumbHeader = (
    <>
      <ProgramBreadcrumb />
      <View style={styles.navPathContainer}>
        <Text style={styles.navPathText} numberOfLines={1} ellipsizeMode="tail">
          Products {'>'} {productBreadcrumbLabel} {'>'} Transactions
        </Text>
      </View>
    </>
  );

  const listHeaderTitle =
    summaryFocus === 'pending'
      ? 'Pending Invoices'
      : summaryFocus === 'pendingNoa'
        ? 'Pending Notice of Assignment'
        : summaryFocus === 'draft'
          ? 'Draft Invoices'
          : summaryFocus === 'actionRequired'
            ? 'Action Required'
            : dealerListTitle;

  const renderControls = (hideListTitle: boolean) => (
    <View style={styles.controlsOutsideList}>
            <InvoiceDetailsControls
              dealerListTitle={dealerListTitle}
              programTitle={programName}
              invoiceCount={filteredData.length}
              listHeaderTitle={listHeaderTitle}
              hideListTitle={hideListTitle}
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
              pendingNoaCount={pendingNoaCount}
              draftCount={draftCount}
              summaryFocus={summaryFocus}
              onSummaryFocusChange={onSummaryFocusChange}
              summaryFocusHint={summaryFocusHint}
              onBulkAction={handleBulkAction}
              canEdit={canEdit}
              canImport={canImport}
              canNoticeOfAssignment={canNoticeOfAssignment}
              onRefresh={refreshInvoiceList}
              listRefreshing={invoiceListLoading}
              showSearchAndFilter={invoiceData.length > 0 && !invoiceListError}
            />
            <View style={styles.listTopSeparator} />
    </View>
  );

  type ListEntry =
    | {kind: 'controls'; id: string}
    | {kind: 'title'; id: string}
    | {kind: 'empty'; id: string}
    | {kind: 'row'; id: string; row: (typeof paginatedData)[number]};

  // Index 0 is ListHeaderComponent (breadcrumb), so controls sit at sticky index 1.
  const listEntries: ListEntry[] = [
    {kind: 'controls', id: '__controls__'},
    {kind: 'title', id: '__title__'},
    ...(paginatedData.length > 0
      ? paginatedData.map(row => ({kind: 'row' as const, id: row.id, row}))
      : [{kind: 'empty' as const, id: '__empty__'}]),
  ];

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
      {!hasAnyProgramContext ? (
        <>
          {breadcrumbHeader}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Select a program first to view invoice list.
              </Text>
            </View>
          </ScrollView>
        </>
      ) : (
        <>
          {invoiceListError ? (
            <>
            {breadcrumbHeader}
            {renderControls(false)}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}>
              <View style={styles.emptyState}>
                <Text style={styles.errorStateTitle}>Unable to load invoices</Text>
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
                      <Text style={styles.errorRefreshButtonText}>Try again</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
            </>
          ) : invoiceListLoading && invoiceData.length === 0 ? (
            <>
              {breadcrumbHeader}
              {renderControls(false)}
              <View style={styles.skeletonContainer}>
                <SkeletonList variant="grid" count={4} />
              </View>
            </>
          ) : (
            <>
              <FlatList
                style={styles.scroll}
                contentContainerStyle={styles.listContent}
                data={listEntries}
                keyExtractor={entry => entry.id}
                ListHeaderComponent={breadcrumbHeader}
                stickyHeaderIndices={[1]}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={({leadingItem}: {leadingItem?: ListEntry}) =>
                  leadingItem?.kind === 'row' ? (
                    <View style={{height: scaleHeight(10)}} />
                  ) : null
                }
                renderItem={({item: entry, index}) => {
                  if (entry.kind === 'controls') {
                    return renderControls(true);
                  }
                  if (entry.kind === 'title') {
                    return (
                      <View style={styles.listTitleItem}>
                        <InvoiceListTitle
                          title={listHeaderTitle}
                          count={filteredData.length}
                        />
                      </View>
                    );
                  }
                  if (entry.kind === 'empty') {
                    if (invoiceListLoading) {
                      return (
                        <View style={styles.listItem}>
                          <SkeletonList variant="grid" count={4} />
                        </View>
                      );
                    }
                    return filteredData.length === 0 ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>{listEmptyMessage}</Text>
                      </View>
                    ) : null;
                  }
                  const row = entry.row;
                  return (
                  <View style={styles.listItem}>
                  <InvoiceDetailsCard
                    row={row}
                    index={index - 2}
                    isAnchorMaker={isAnchorMaker}
                    isDealerMaker={isDealerMaker}
                    isDealerChecker={isDealerChecker}
                    isAnchorChecker={isAnchorChecker}
                    isCashnTechUser={isCashnTechUser}
                    isAnchorAllAccess={isAnchorAllAccess}
                    isDealerAllAccess={isDealerAllAccess}
                    storedUserRole={storedUserRole}
                    transparency={invoiceListLoading ? 0.6 : 1}
                    isSelected={
                      (isDealerChecker ||
                        isAnchorChecker ||
                        isCashnTechUser ||
                        isVfAnchorMaker) &&
                      selectedInvoiceIds.includes(row.id)
                    }
                    onMenuToggle={handleMenuToggle}
                    onToggleSelection={toggleInvoiceSelection}
                    onInvoiceNoPress={handleInvoiceNoPress}
                    registerMenuRef={registerMenuRef}
                    isSelectable={isInvoiceSelectable(row)}
                    showBulkCheckbox={isVfAnchorMaker}
                  />
                  </View>
                  );
                }}
                onEndReached={hasMore ? loadMore : undefined}
                onEndReachedThreshold={0.3}
                onScrollBeginDrag={() => {
                  setOpenMenuId(null);
                  setMenuAnchor(null);
                }}
                ListFooterComponent={
                  hasMore && !invoiceListLoading ? (
                    <View style={styles.loadMoreFooter}>
                      <ActivityIndicator
                        size="small"
                        color={Colors.primaryColor}
                      />
                      <Text style={styles.loadMoreText}>Loading more...</Text>
                    </View>
                  ) : null
                }
              />
              { (invoiceListLoading || summaryFocusSwitching) && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.overlaySpinnerContainer}>
                    <ActivityIndicator
                      size="large"
                      color={Colors.primaryColor}
                    />
                    <Text style={styles.overlayLoadingText}>
                      {summaryFocusSwitching
                        ? summaryFocusSwitchMessage
                        : 'Loading Invoices...'}
                    </Text>
                  </View>
                </View>
              )}
            </>
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
        steps={approvalHistoryEntries}
        loading={approvalHistoryLoading}
        productInvoiceLabel={`${getPartyLabels(effectiveProductCode).singular} Invoice`}
        invoiceNo={selectedInvoiceNo || undefined}
        invoiceAmount={approvalHistorySummary.invoiceAmount}
        counterParty={approvalHistorySummary.counterParty}
        primaryParty={approvalHistorySummary.primaryParty}
        raisedOn={approvalHistorySummary.raisedOn}
        dueOn={approvalHistorySummary.dueOn}
        programName={approvalHistorySummary.programName}
      />

      <FinanceRequestDetailsModal
        visible={showFinanceRequestModal}
        onClose={closeFinanceRequestModal}
        loading={financeRequestLoading}
        submitting={financeRequestSubmitting}
        preview={financeRequestPreview}
        productCode={effectiveProductCode}
        onSubmit={submitFinanceRequest}
      />

      <NoticeOfAssignmentModal
        visible={showNoaModal}
        onClose={closeNoaModal}
        loading={noaLoading}
        submitting={noaSubmitting}
        readOnly={noaReadOnly}
        preview={noaPreview}
        productCode={effectiveProductCode}
        onSubmit={submitNoticeOfAssignment}
      />

      <ApproveRejectModal
        visible={showApproveRejectModal}
        invoiceId={selectedInvoiceId}
        invoiceNo={selectedInvoiceNo || undefined}
        productCode={effectiveProductCode}
        allowGrnDateEdit={isAnchorMaker}
        dueDateCalculatedFrom={dueDateCalculatedFrom}
        variant={
          isCashnTechUser
            ? 'cashntech_verification'
            : isAnchorChecker
              ? 'anchor_checker'
              : 'default'
        }
        invoiceDetails={
          anchorCheckerInvoiceDetails ?? selectedInvoiceDetails
        }
        detailsLoading={anchorCheckerDetailsLoading}
        autoCloseOnAction={false}
        onClose={() => {
          if (actionBusy) {
            return;
          }
          setShowApproveRejectModal(false);
          setSelectedInvoiceId(null);
          setSelectedInvoiceNo(null);
        }}
        onApprove={(invoiceId, remarks, grnDate) => {
          if (isCashnTechUser) {
            onVerifyApprove(invoiceId, remarks);
          } else {
            onApproveRejectApprove(invoiceId, remarks, grnDate);
          }
        }}
        onReject={(invoiceId, remarks, grnDate) => {
          if (isCashnTechUser) {
            onVerifyReject(invoiceId, remarks);
          } else {
            onApproveRejectReject(invoiceId, remarks, grnDate);
          }
        }}
        onHold={(invoiceId, remarks) => {
          if (isCashnTechUser) {
            onVerifyHold(invoiceId, remarks);
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
        listDeletable={selectedInvoiceDeletable}
        currentStepActionType={selectedInvoiceCurrentStepActionType}
        userDepartment={userDepartment}
        approvalLogsCount={selectedInvoiceApprovalLogsCount}
        currentStepSequenceNo={selectedInvoiceCurrentStepSequenceNo}
        programMethod={selectedInvoiceProgramMethod}
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
        isVfAnchorMaker={isVfAnchorMaker}
        canBulkApprove={canBulkActions && canApprove}
        canBulkReject={canBulkActions && (canReject || canApprove)}
        canBulkVerify={canUploadVerify}
        canBulkOnHold={canUploadVerify}
        canBulkRejectAdmin={canUploadVerify}
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
        requireGrnDate={isVfAnchorMaker}
        onSubmit={handleBulkReviewSubmit}
        loading={bulkLoading}
      />

      <BusyOverlay
        visible={
          actionBusy ||
          bulkLoading ||
          financeRequestSubmitting ||
          noaSubmitting
        }
        message={
          actionBusy
            ? actionBusyMessage
            : bulkLoading
              ? 'Updating invoices…'
              : financeRequestSubmitting
                ? 'Submitting finance request…'
                : noaSubmitting
                  ? 'Serving notice of assignment…'
                  : 'Please wait…'
        }
      />
    </Container>
  );
};
