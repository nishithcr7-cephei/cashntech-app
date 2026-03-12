import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  AppBar,
  CheckerApprovalModal,
  ApproveRejectModal,
  Container,
  FilterModal,
  UploadModal,
  ProgramBreadcrumb,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {LeftChevron} from '@assets/Icons';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {useInvoiceDetails} from './useInvoiceDetails';
import {InvoiceDetailsControls} from './InvoiceDetailsControls';
import {InvoiceDetailsCard} from './InvoiceDetailsCard';
import {SendForApprovalModal} from './SendForApprovalModal';
import {InvoiceActionMenuModal} from './InvoiceActionMenuModal';
import {SelectProgramModal} from './SelectProgramModal';
import {styles} from './InvoiceDetails.styles';

export const InvoiceDetails: React.FC = () => {
  const {
    programId,
    programName,
    summaryStats,
    navigation,
    invoiceData,
    filteredData,
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
    selectedInvoiceIds,
    showSendForApprovalModal,
    setShowSendForApprovalModal,
    selectedRowsForModal,
    allSelectedOnScreen,
    fromInvoiceDashboard,
    handleMenuToggle,
    handleMenuAction,
    handleAttachmentUpload,
    toggleInvoiceSelection,
    toggleSelectAllVisible,
    onApproveRejectApprove,
    onApproveRejectReject,
    onVerifyApprove,
    onVerifyReject,
    onBulkApply,
    getMenuPosition,
    showSelectProgramForCreateModal,
    setShowSelectProgramForCreateModal,
    onCreateInvoicePress,
    onProgramSelectedForCreate,
    isCreateInvoiceEnabled,
    hasAnyProgramContext,
    invoiceFilterData,
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
      {programName ? (
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>{programName}</Text>
        </View>
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}>
        {!hasAnyProgramContext ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Select a program first to view invoice list.
            </Text>
          </View>
        ) : invoiceListError ? (
          <View style={styles.emptyState}>
            <Text style={styles.errorStateText}>{invoiceListError}</Text>
          </View>
        ) : (
          <>
            {/* Summary metrics: Dealers, Total Invoices, Total Amount, Pending, Approved, Rejected */}
            {!isAnchorMaker && (
              <View style={styles.summaryCardGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Dealers</Text>
                  <Text style={styles.summaryCardValue} numberOfLines={1}>{summaryStats.dealers}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Total Invoices</Text>
                  <Text style={styles.summaryCardValue} numberOfLines={1}>{summaryStats.totalInvoices}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Total Invoice Amount</Text>
                  <Text style={styles.summaryCardValue} numberOfLines={1}>{summaryStats.totalInvoiceAmount}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Pending Invoices</Text>
                  <Text style={styles.summaryCardValue} numberOfLines={1}>{summaryStats.pendingInvoices}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Approved Invoices</Text>
                  <Text style={styles.summaryCardValue} numberOfLines={1}>{summaryStats.approvedInvoices}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardLabel}>Rejected Invoices</Text>
                  <Text style={styles.summaryCardValue} numberOfLines={1}>{summaryStats.rejectedInvoices}</Text>
                </View>
              </View>
            )}

            <InvoiceDetailsControls
              dealerListTitle={dealerListTitle}
              invoiceCount={invoiceData.length}
              summaryStats={summaryStats}
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
            />

            <View style={styles.listTopSeparator} />
            {invoiceListLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading invoices...</Text>
              </View>
            ) : filteredData.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {selectedDealerName
                    ? `No invoices found for ${selectedDealerName}`
                    : 'No invoices found'}
                </Text>
              </View>
            ) : (
              <View style={styles.verticalList}>
                {filteredData.map(row => (
                  <InvoiceDetailsCard
                    key={row.id}
                    row={row}
                    isAnchorMaker={isAnchorMaker}
                    isDealerMaker={isDealerMaker}
                    isDealerChecker={isDealerChecker}
                    isAnchorChecker={isAnchorChecker}
                    isCashnTechUser={isCashnTechUser}
                    isSelected={(isDealerChecker || isAnchorChecker) && selectedInvoiceIds.includes(row.id)}
                    onMenuToggle={handleMenuToggle}
                    onToggleSelection={toggleInvoiceSelection}
                    registerMenuRef={registerMenuRef}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

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

      <UploadModal
        visible={showAttachmentModal}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={handleAttachmentUpload}
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
      />

      <SelectProgramModal
        visible={showSelectProgramForCreateModal}
        onClose={() => setShowSelectProgramForCreateModal(false)}
        onProgramSelected={onProgramSelectedForCreate}
      />
    </Container>
  );
};
