import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  AppBar,
  CheckerApprovalModal,
  ApproveRejectModal,
  Container,
  FilterModal,
  InvoiceAttachmentsModal,
  ProgramBreadcrumb,
} from '@components/index';
import {Colors} from '@constants/index';
import {LeftChevron} from '@assets/Icons';
import {scaleWidth, scaleHeight} from '@utils/Scale';
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
  } = useInvoiceDetails();

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
      />
      <ProgramBreadcrumb />
      {hasAnyProgramContext && !isAnchorMaker && (
        <View style={styles.selectedProgramRow}>
          <Text style={styles.selectedProgramText}>
            {programName || '-'}
          </Text>
        </View>
      )}
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
        <FlatList
          style={styles.scroll}
          contentContainerStyle={styles.content}
          data={invoiceListLoading ? [] : paginatedData}
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
              />
              <View style={styles.listTopSeparator} />
              {invoiceListLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryColor} />
                  <Text style={styles.loadingText}>Loading invoices...</Text>
                </View>
              )}
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
              isSelected={(isDealerChecker || isAnchorChecker) && selectedInvoiceIds.includes(row.id)}
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

    </Container>
  );
};
