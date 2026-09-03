import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  AppBar,
  Container,
  ScopeSelectorCard,
  BulkReviewModal,
  BusyOverlay,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleWidth, scaleHeight, scaleFont} from '@utils/Scale';
import {BankBuilding} from '@assets/Icons';

import {styles} from './InvoiceDashboard.styles';
import {useInvoiceDashboard} from './hooks/useInvoiceDashboard';
import {getCardMetrics} from './utils/dashboardUtils';
import {MetricsCard} from './components/MetricsCard';
import {DealerSummaryList} from './components/DealerSummaryList';
import {LatestInvoicesList} from './components/LatestInvoicesList';

export const InvoiceDashboard: React.FC = () => {
  const {
    navigation,
    summaryData,
    summaryLoading,
    latestData,
    latestLoading,
    kpis,
    kpisLoading,
    isAnchorMaker,
    isAnchorChecker,
    isDealerMaker,
    isDealerChecker,
    isCashnTechUser,
    activeTab,
    setActiveTab,
    productTab,
    selectedInvoices,
    setSelectedInvoices,
    showBulkReviewModal,
    setShowBulkReviewModal,
    bulkAction,
    bulkLoading,
    permissionsLoading,
    canApprove,
    canReject,
    handleBulkAction,
    onBulkSubmit,
    productBreadcrumbLabel,
  } = useInvoiceDashboard();

  const metrics = getCardMetrics(productTab, kpis, summaryData);

  const toggleSelectInvoice = (invoice: {
    id: string;
    invoiceNo: string;
    amount: any;
    dealerName: string;
    rawApprovalStatus?: string;
  }) => {
    setSelectedInvoices(prev => {
      const exists = prev.find(inv => inv.id === invoice.id);
      if (exists) {
        return prev.filter(inv => inv.id !== invoice.id);
      }
      return [...prev, invoice];
    });
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === latestData.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(
        latestData.map(row => ({
          id: row.id,
          invoiceNo: row.invoice_ref_no,
          amount: row.final_total || '0',
          dealerName: row.partyName || row.party?.entity_name || 'Unknown',
          rawApprovalStatus: row.approval_status,
        }))
      );
    }
  };

  return (
    <Container>
      <AppBar title="Transactions > Invoice Overview" navigation={navigation as any} />
      <ScopeSelectorCard />
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText} numberOfLines={1} ellipsizeMode="tail">
          Products {'>'} {productBreadcrumbLabel} {'>'} Transactions
        </Text>
      </View>

      {/* Removed Overview label and ProductTabs as per request */}


      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.keyFigureHeading}>Invoice Dashboard : Key Figures</Text>
        <MetricsCard metrics={metrics} loading={kpisLoading} />

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'dealers' && styles.activeTab]}
            onPress={() => setActiveTab('dealers')}>
            <Text style={[styles.tabText, activeTab === 'dealers' && styles.activeTabText]}>
              {(isAnchorMaker || isAnchorChecker)
                ? 'Summary of Dealers'
                : (isDealerMaker || isDealerChecker)
                  ? 'Summary of Anchors'
                  : isCashnTechUser
                    ? 'Summary of All Program'
                    : 'Dealers Summary'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'unpaid' && styles.activeTab]}
            onPress={() => setActiveTab('unpaid')}>
            <Text style={[styles.tabText, activeTab === 'unpaid' && styles.activeTabText]}>
              {(isCashnTechUser || isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker) ? 'Latest Invoice' : 'Latest/Unpaid Invoices'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'dealers' ? (
            <>
              <View style={styles.allProgramHeader}>
                {!(isCashnTechUser || isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker) && (
                  <BankBuilding width={scaleWidth(18)} height={scaleWidth(18)} />
                )}
                {(isCashnTechUser || isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker) ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) }}>
                    <Text style={styles.allProgramTitle}>OD Accounts Summary</Text>
                    <View style={{ backgroundColor: '#FFF0F0', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(2), borderWidth: 1, borderColor: '#FFD9D9' }}>
                      <Text style={{ color: Colors.primaryColor, fontSize: scaleFont(12), fontFamily: Fonts.GilroySemiBold }}>{summaryData.length}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.allProgramTitle}>All Program</Text>
                )}
              </View>
              <DealerSummaryList
                loading={summaryLoading}
                data={summaryData}
                isCashnTechUser={isCashnTechUser}
                isAnchorMaker={isAnchorMaker}
                isAnchorChecker={isAnchorChecker}
                isDealerMaker={isDealerMaker}
                isDealerChecker={isDealerChecker}
                onDealerPress={(id, no) => {
                  navigation.navigate('InvoiceDetails', {
                    dealerId: id,
                    dealerNo: no,
                  });
                }}
              />
            </>
          ) : (
            <>
              {(isCashnTechUser || isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker) && (
                <View style={styles.allProgramHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) }}>
                    <Text style={styles.allProgramTitle}>Invoice List</Text>
                    <View style={{ backgroundColor: '#FFF0F0', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(2), borderWidth: 1, borderColor: '#FFD9D9' }}>
                      <Text style={{ color: Colors.primaryColor, fontSize: scaleFont(12), fontFamily: Fonts.GilroySemiBold }}>{latestData.length}</Text>
                    </View>
                  </View>
                </View>
              )}
              <LatestInvoicesList
                loading={latestLoading}
                data={latestData}
                selectedInvoices={selectedInvoices}
                onSelectInvoice={toggleSelectInvoice}
                onSelectAll={handleSelectAll}
                isCashnTechUser={isCashnTechUser}
                isAnchorMaker={isAnchorMaker}
                isAnchorChecker={isAnchorChecker}
                isDealerMaker={isDealerMaker}
                isDealerChecker={isDealerChecker}
                productTab={productTab}
              />
            </>
          )}
        </View>
      </ScrollView>

      {!permissionsLoading && (isCashnTechUser || isAnchorChecker || isDealerChecker) && selectedInvoices.length > 0 && (
        <View style={styles.bulkActionBar}>
          <View style={styles.bulkActionInfo}>
            <Text style={styles.bulkActionCount}>{selectedInvoices.length} Selected</Text>
            <TouchableOpacity onPress={() => setSelectedInvoices([])}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bulkButtons}>
            {canApprove && (isAnchorChecker || isDealerChecker) && (
              <TouchableOpacity
                style={[styles.bulkBtn, styles.bulkBtnVerify]}
                onPress={() => handleBulkAction('Approve')}>
                <Text style={styles.bulkBtnText}>Approve</Text>
              </TouchableOpacity>
            )}
            {isCashnTechUser && (
              <TouchableOpacity
                style={[styles.bulkBtn, styles.bulkBtnVerify]}
                onPress={() => handleBulkAction('Verify')}>
                <Text style={styles.bulkBtnText}>Verify</Text>
              </TouchableOpacity>
            )}
            {(canReject || canApprove) && (isAnchorChecker || isDealerChecker) && (
              <TouchableOpacity
                style={[styles.bulkBtn, styles.bulkBtnReject]}
                onPress={() => handleBulkAction('Reject')}>
                <Text style={styles.bulkBtnText}>Reject</Text>
              </TouchableOpacity>
            )}
            {isCashnTechUser && (
              <TouchableOpacity
                style={[styles.bulkBtn, styles.bulkBtnHold]}
                onPress={() => handleBulkAction('On Hold')}>
                <Text style={styles.bulkBtnText}>Hold</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <BulkReviewModal
        visible={showBulkReviewModal}
        onClose={() => setShowBulkReviewModal(false)}
        selectedInvoices={selectedInvoices}
        action={bulkAction}
        onSubmit={onBulkSubmit}
        loading={bulkLoading}
      />
      <BusyOverlay
        visible={bulkLoading}
        message="Updating invoices…"
      />
    </Container>
  );
};
