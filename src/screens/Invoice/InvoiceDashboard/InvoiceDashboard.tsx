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
  ProgramBreadcrumb,
  BulkReviewModal,
} from '@components/index';
import {Colors} from '@constants/index';
import {scaleWidth} from '@utils/Scale';
import {BankBuilding} from '@assets/Icons';

import {styles} from './InvoiceDashboard.styles';
import {useInvoiceDashboard} from './hooks/useInvoiceDashboard';
import {getCardMetrics} from './utils/dashboardUtils';
import {MetricsCard} from './components/MetricsCard';
import {ProductTabs} from './components/ProductTabs';
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
    isDealerMaker,
    isCashnTechUser,
    activeTab,
    setActiveTab,
    productTab,
    setProductTab,
    selectedInvoices,
    setSelectedInvoices,
    showBulkReviewModal,
    setShowBulkReviewModal,
    bulkAction,
    bulkLoading,
    handleBulkAction,
    onBulkSubmit,
  } = useInvoiceDashboard();

  const metrics = getCardMetrics(productTab, kpis, summaryData);

  const toggleSelectInvoice = (invoice: {id: string; invoiceNo: string; amount: any; dealerName: string}) => {
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
        }))
      );
    }
  };

  return (
    <Container>
      <AppBar title="Invoice Overview" navigation={navigation as any} />
      <ProgramBreadcrumb />

      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Overview</Text>
        <ProductTabs activeTab={productTab} onTabChange={setProductTab} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        <Text style={styles.keyFigureHeading}>Key Figures</Text>
        <MetricsCard metrics={metrics} loading={kpisLoading} />

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'dealers' && styles.activeTab]}
            onPress={() => setActiveTab('dealers')}>
            <Text style={[styles.tabText, activeTab === 'dealers' && styles.activeTabText]}>
              Dealers Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'unpaid' && styles.activeTab]}
            onPress={() => setActiveTab('unpaid')}>
            <Text style={[styles.tabText, activeTab === 'unpaid' && styles.activeTabText]}>
              Latest/Unpaid Invoices
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'dealers' ? (
            <>
              <View style={styles.allProgramHeader}>
                <BankBuilding width={scaleWidth(18)} height={scaleWidth(18)} />
                <Text style={styles.allProgramTitle}>All Program</Text>
              </View>
              <DealerSummaryList
                loading={summaryLoading}
                data={summaryData}
                onDealerPress={(id, no) => {
                  navigation.navigate('InvoiceDetails', {
                    dealerId: id,
                    dealerNo: no,
                  });
                }}
              />
            </>
          ) : (
            <LatestInvoicesList
              loading={latestLoading}
              data={latestData}
              selectedInvoices={selectedInvoices}
              onSelectInvoice={toggleSelectInvoice}
              onSelectAll={handleSelectAll}
              isCashnTechUser={isCashnTechUser}
            />
          )}
        </View>
      </ScrollView>

      {isCashnTechUser && selectedInvoices.length > 0 && (
        <View style={styles.bulkActionBar}>
          <View style={styles.bulkActionInfo}>
            <Text style={styles.bulkActionCount}>{selectedInvoices.length} Selected</Text>
            <TouchableOpacity onPress={() => setSelectedInvoices([])}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bulkButtons}>
            <TouchableOpacity 
              style={[styles.bulkBtn, styles.bulkBtnVerify]}
              onPress={() => handleBulkAction('Verify')}>
              <Text style={styles.bulkBtnText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkBtn, styles.bulkBtnReject]}
              onPress={() => handleBulkAction('Reject')}>
              <Text style={styles.bulkBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkBtn, styles.bulkBtnHold]}
              onPress={() => handleBulkAction('On Hold')}>
              <Text style={styles.bulkBtnText}>Hold</Text>
            </TouchableOpacity>
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
    </Container>
  );
};
