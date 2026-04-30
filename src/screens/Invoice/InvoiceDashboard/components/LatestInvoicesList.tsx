import React from 'react';
import {View, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors} from '@constants/index';
import {styles} from '../InvoiceDashboard.styles';
import {scaleHeight, scaleWidth} from '@utils/Scale';
import {Tick} from '@assets/Icons';
import type {InvoiceOverviewLatestItem} from '@store/invoiceOverview';
import type {BulkInvoiceItem} from '@components/index';
import {formatDateDDMmmYYYY} from '../utils/dashboardUtils';

interface LatestInvoicesListProps {
  loading: boolean;
  data: InvoiceOverviewLatestItem[];
  selectedInvoices: BulkInvoiceItem[];
  onSelectInvoice: (invoice: BulkInvoiceItem) => void;
  onSelectAll: () => void;
  isCashnTechUser: boolean;
  isAnchorMaker?: boolean;
  isAnchorChecker?: boolean;
}

export const LatestInvoicesList: React.FC<LatestInvoicesListProps> = ({
  loading,
  data,
  selectedInvoices,
  onSelectInvoice,
  onSelectAll,
  isCashnTechUser,
  isAnchorMaker = false,
  isAnchorChecker = false,
}) => {
  const showCashnTechLayout = isCashnTechUser || isAnchorMaker || isAnchorChecker;

  if (loading) {
    return (
      <View style={[styles.verticalList, {justifyContent: 'center', alignItems: 'center', paddingVertical: scaleHeight(40)}]}>
        <ActivityIndicator size="large" color={Colors.primaryColor} />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={[styles.verticalList, {justifyContent: 'center', alignItems: 'center', paddingVertical: scaleHeight(40)}]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const allSelected = data.length > 0 && selectedInvoices.length === data.length;

  return (
    <View style={styles.verticalList}>


      {data.map((row, index) => {
        const isSelected = selectedInvoices.some(inv => inv.id === row.id);
        
        return (
          <View key={`${row.id || 'row'}-${index}`} style={styles.cardWrapper}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (showCashnTechLayout) {
                  onSelectInvoice({
                    id: row.id,
                    invoiceNo: row.invoice_ref_no,
                    amount: row.final_total || '0',
                    dealerName: row.partyName || row.party?.entity_name || 'Unknown',
                  });
                }
              }}>
              <View style={[styles.listCard, isSelected && {borderColor: Colors.primaryColor, borderWidth: 1}]}>
                {!showCashnTechLayout && (
                  <View style={styles.cardMainRow}>
                    <View style={styles.cardHeaderContent}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{row.invoice_ref_no}</Text>
                      </View>
                      <Text style={styles.cardSubtitle}>
                        {row.partyName || row.party?.entity_name || 'N/A'}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusChip, 
                      (row.invoice_status === 'OVERDUE' || row.invoice_status === 'REJECTED') && styles.statusWarningChip
                    ]}>
                      <Text style={[
                        styles.statusChipText,
                        row.invoice_status === 'OVERDUE' && styles.statusRedText,
                        row.invoice_status === 'PAID' && styles.statusGreenText,
                        row.invoice_status === 'SUBMITTED' && styles.statusOrangeText,
                      ]}>
                        {row.invoice_status || 'N/A'}
                      </Text>
                    </View>
                  </View>
                )}

                {showCashnTechLayout ? (
                  <>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    <View style={styles.infoGrid}>
                    <View style={[styles.infoColumn, {width: '100%', marginBottom: scaleHeight(6)}]}>
                      <Text style={styles.infoLabel}>Dealer</Text>
                      <Text style={styles.infoValue}>{row.counterPartyName || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice No.</Text>
                      <Text style={styles.infoValue}>{row.invoice_ref_no || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Date</Text>
                      <Text style={styles.infoValue}>{formatDateDDMmmYYYY(row.invoice_date) || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Disbursed Date</Text>
                      <Text style={styles.infoValue}>{formatDateDDMmmYYYY(row.disbursement_date) || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                      <Text style={styles.infoValue}>₹ {(Number(row.final_total) || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Disb. Amount (₹)</Text>
                      <Text style={styles.infoValue}>₹ {(Number(row.disbursed_amount) || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>UTR No.</Text>
                      <Text style={styles.infoValue}>{row.utr_no || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Status</Text>
                      <Text style={[styles.infoValue, {color: Colors.green}]}>{row.invoice_status || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Approval Status</Text>
                      <Text style={styles.infoValue}>{row.approval_status || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Admin Status</Text>
                      <Text style={styles.infoValue}>{row.admin_status || '-'}</Text>
                    </View>
                  </View>
                  </>
                ) : (
                  <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Amount</Text>
                      <Text style={styles.infoValue}>
                        ₹ {(Number(row.final_total) || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Due Date</Text>
                      <Text style={styles.infoValue}>
                        {formatDateDDMmmYYYY(row.invoice_due_date)}
                      </Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Program</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {row.program_name || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Bank</Text>
                      <Text style={styles.infoValue}>{row.bank_name || 'N/A'}</Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};
