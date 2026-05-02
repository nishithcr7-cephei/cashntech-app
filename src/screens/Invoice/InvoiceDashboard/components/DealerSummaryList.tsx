import React from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Colors} from '@constants/index';
import {styles} from '../InvoiceDashboard.styles';
import {scaleHeight} from '@utils/Scale';
import type {InvoiceOverviewSummaryItem} from '@store/invoiceOverview';

interface DealerSummaryListProps {
  loading: boolean;
  data: InvoiceOverviewSummaryItem[];
  onDealerPress: (dealerId: string, dealerNo: string) => void;
  isCashnTechUser?: boolean;
  isAnchorMaker?: boolean;
  isAnchorChecker?: boolean;
  isDealerMaker?: boolean;
  isDealerChecker?: boolean;
}

export const DealerSummaryList: React.FC<DealerSummaryListProps> = ({
  loading,
  data,
  onDealerPress,
  isCashnTechUser = false,
  isAnchorMaker = false,
  isAnchorChecker = false,
  isDealerMaker = false,
  isDealerChecker = false,
}) => {
  const showCashnTechLayout = isCashnTechUser || isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker;

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

  return (
    <View style={styles.verticalList}>
      {data.map((row, index) => (
        <TouchableOpacity
          key={`${row.id || 'row'}-${index}`}
          activeOpacity={0.7}
          onPress={() => onDealerPress(row.id, row.dealer_no || row.od_account_no || '')}>
          <View style={styles.listCard}>
            {showCashnTechLayout ? (
              <>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <View style={styles.infoGrid}>
                <View style={[styles.infoColumn, {width: '100%', marginBottom: scaleHeight(6)}]}>
                  <Text style={styles.infoLabel}>Program</Text>
                  <Text style={styles.infoValue}>{row.program_name || '-'}</Text>
                </View>

                {!(isDealerMaker || isDealerChecker) && (
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{row.counterPartyName || row.dealer_name || row.partyName || '-'}</Text>
                  </View>
                )}

                {!(isAnchorMaker || isAnchorChecker) && (
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Primary Party</Text>
                    <Text style={styles.infoValue}>{row.partyName || '-'}</Text>
                  </View>
                )}
                
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>OD Account</Text>
                  <Text style={styles.infoValue}>{row.od_account_no || '-'}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Drawing Power</Text>
                  <Text style={styles.infoValue}>
                    ₹ {(Number(row.drawing_power) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Utilized Amount</Text>
                  <Text style={styles.infoValue}>
                    ₹ {(Number(row.utilized_amount) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Pipeline Requests</Text>
                  <Text style={styles.infoValue}>
                    ₹ {(Number(row.pipeline_requests) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Available Limit</Text>
                  <Text style={styles.infoValue}>
                    ₹ {((Number(row.drawing_power) || Number(row.sanctioned_limit) || 0) - (Number(row.utilized_amount) || 0)).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Overdue Amount</Text>
                  <Text style={[styles.infoValue, {color: Colors.red}]}>
                    ₹ {(Number(row.overdue_amount) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>DPD Days</Text>
                  <Text style={styles.infoValue}>{row.dpd_days || 0}</Text>
                </View>
                </View>
              </>
            ) : (
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Sanctioned Limit</Text>
                  <Text style={styles.infoValue}>
                    ₹ {(Number(row.sanctioned_limit) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Utilized Amount</Text>
                  <Text style={styles.infoValue}>
                    ₹ {(Number(row.utilized_amount) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Overdue Amount</Text>
                  <Text style={[styles.infoValue, {color: Colors.red}]}>
                    ₹ {(Number(row.overdue_amount) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>DPD Days</Text>
                  <Text style={styles.infoValue}>{row.dpd_days || 0}</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
