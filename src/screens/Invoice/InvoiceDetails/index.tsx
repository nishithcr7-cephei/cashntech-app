import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  AppBar,
  CheckerApprovalModal,
  ApproveRejectModal,
  Container,
  FilterModal,
  UploadModal,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {LeftChevron, RightChevron} from '@assets/Icons';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {BankBuilding, Folder, File, EditIcon} from '@assets/Icons';
import {useInvoiceDetails} from './useInvoiceDetails';
import {invoiceFilterData} from './types';
import {InvoiceDetailsControls} from './InvoiceDetailsControls';
import {InvoiceDetailsCard} from './InvoiceDetailsCard';
import {SendForApprovalModal} from './SendForApprovalModal';
import {InvoiceActionMenuModal} from './InvoiceActionMenuModal';
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
    showApproveRejectModal,
    setShowApproveRejectModal,
    selectedInvoiceId,
    setSelectedInvoiceId,
    selectedInvoiceNo,
    setSelectedInvoiceNo,
    showAttachmentModal,
    selectedInvoiceIds,
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
  } = useInvoiceDetails();

  const registerMenuRef = (id: string, ref: View | null) => {
    menuButtonRefs.current[id] = ref;
  };

  return (
    <Container>
      <AppBar
        title="Transactions > Invoice List & Approval"
        navigation={navigation as any}
        hideHamburger={(isAnchorMaker || isDealerMaker) && fromInvoiceDashboard}
        renderLeftIcon={fromInvoiceDashboard ? <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} /> : undefined}
        onPressLeftIcon={fromInvoiceDashboard ? () => navigation.goBack() : undefined}
      />
      {fromInvoiceDashboard && breadcrumbBank && breadcrumbDealer && breadcrumbProgram && !showAllProgramBreadcrumb ? (
        <View style={styles.breadcrumbContainer}>
          <View style={styles.breadcrumbCard}>
            <View style={styles.breadcrumbRow}>
              <View style={styles.breadcrumbItem}>
                <BankBuilding width={scaleWidth(14)} height={scaleWidth(14)} color={Colors.primaryColor} />
                <Text style={styles.breadcrumbText} numberOfLines={1} ellipsizeMode="tail">{breadcrumbBank}</Text>
              </View>
              <RightChevron height={scaleHeight(12)} width={scaleWidth(12)} style={styles.breadcrumbChev} />
              <View style={styles.breadcrumbItem}>
                <Folder width={scaleWidth(14)} height={scaleWidth(14)} color={Colors.primaryColor} />
                <Text style={styles.breadcrumbText} numberOfLines={1} ellipsizeMode="tail">{breadcrumbDealer}</Text>
              </View>
              <RightChevron height={scaleHeight(12)} width={scaleWidth(12)} style={styles.breadcrumbChev} />
              <View style={styles.breadcrumbItemGrow}>
                <File width={scaleWidth(14)} height={scaleWidth(14)} color={Colors.primaryColor} />
                <Text style={styles.breadcrumbTextGrow} numberOfLines={1} ellipsizeMode="tail">{breadcrumbProgram}</Text>
              </View>
              <TouchableOpacity style={styles.breadcrumbChangePill} onPress={() => (navigation as any).navigate('SelectProgramScreen')} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <EditIcon />
                <Text style={styles.breadcrumbChangeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.breadcrumbContainer}>
          <View style={styles.breadcrumbCard}>
            <View style={styles.breadcrumbRow}>
              <View style={styles.breadcrumbItemGrow}>
                <File width={scaleWidth(14)} height={scaleWidth(14)} color={Colors.primaryColor} />
                <Text style={styles.breadcrumbTextGrow} numberOfLines={1} ellipsizeMode="tail">All Program</Text>
              </View>
              <TouchableOpacity style={styles.breadcrumbChangePill} onPress={() => (navigation as any).navigate('SelectProgramScreen')} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <EditIcon />
                <Text style={styles.breadcrumbChangeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>
            Sun Pharma PGM
          </Text>
        </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}>
        {!programId ? (
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

            <InvoiceDetailsControls
              dealerListTitle={dealerListTitle}
              invoiceCount={invoiceData.length}
              isDealerMaker={isDealerMaker}
              isAnchorMaker={isAnchorMaker}
              isAnchorChecker={isAnchorChecker}
              isDealerChecker={isDealerChecker}
              filteredDataLength={filteredData.length}
              searchText={searchText}
              setSearchText={setSearchText}
              onOpenFilterModal={() => setShowFilterModal(true)}
              navigation={navigation}
              allSelectedOnScreen={allSelectedOnScreen}
              onToggleSelectAllVisible={toggleSelectAllVisible}
              selectedInvoiceIdsLength={selectedInvoiceIds.length}
              onOpenSendForApprovalModal={() => setShowSendForApprovalModal(true)}
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
                    isDealerMaker={isDealerMaker}
                    isDealerChecker={isDealerChecker}
                    isAnchorChecker={isAnchorChecker}
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
        }}
        approvalEntries={[
          {
            id: '1',
            approvedBy: 'Company Name_Checker',
            approvalDate: '01-02-2026',
            status: 'Approved',
          },
          {
            id: '2',
            approvedBy: 'Another Checker',
            approvalDate: '05-02-2026',
            status: 'Rejected',
          },
        ]}
      />

      <ApproveRejectModal
        visible={showApproveRejectModal}
        invoiceId={selectedInvoiceId}
        invoiceNo={selectedInvoiceNo || undefined}
        invoiceDetails={{
          subTotal: '10,80,025/-',
          withholdingTaxesPercent: '0.00/-',
          withholdingAmount: '0.00/-',
          finalPayableAmount: '10,80,025/-',
          finalDueDate: 'dd-mm-yyyy',
        }}
        onClose={() => {
          setShowApproveRejectModal(false);
          setSelectedInvoiceId(null);
          setSelectedInvoiceNo(null);
        }}
        onApprove={(invoiceId, _remarks) => {
          onApproveRejectApprove(invoiceId);
        }}
        onReject={() => {
          onApproveRejectReject();
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
      />
    </Container>
  );
};
