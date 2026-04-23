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
}

export const DealerSummaryList: React.FC<DealerSummaryListProps> = ({
  loading,
  data,
  onDealerPress,
}) => {
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
            <View style={styles.cardHeaderRow}>
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <View style={styles.cardHeaderContent}>
                <Text style={styles.cardTitle}>{row.dealer_name || row.counterPartyName || row.partyName || 'Unknown'}</Text>
                <Text style={styles.cardSubtitle}>
                  Dealer No: {row.dealer_no || row.od_account_no || 'N/A'}
                </Text>
              </View>
            </View>

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
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
