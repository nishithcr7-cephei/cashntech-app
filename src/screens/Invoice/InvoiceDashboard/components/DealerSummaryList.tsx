import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {SkeletonList} from '@components/index';
import {Colors} from '@constants/index';
import {styles} from '../InvoiceDashboard.styles';
import {scaleHeight} from '@utils/Scale';
import type {InvoiceOverviewSummaryItem} from '@store/invoiceOverview';

interface DealerSummaryListProps {
  loading: boolean;
  error?: string | null;
  data: InvoiceOverviewSummaryItem[];
  onDealerPress: (dealerId: string, dealerNo: string) => void;
  isCashnTechUser?: boolean;
  isAnchorMaker?: boolean;
  isAnchorChecker?: boolean;
  isDealerMaker?: boolean;
  isDealerChecker?: boolean;
}

const formatInr = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(Number(value))) {
    return '-';
  }
  return `₹ ${(Number(value) || 0).toLocaleString('en-IN')}`;
};

const displayText = (value: string | number | null | undefined): string => {
  if (value == null || value === '') {
    return '-';
  }
  return String(value);
};

export const DealerSummaryList: React.FC<DealerSummaryListProps> = ({
  loading,
  error,
  data,
  onDealerPress,
  isCashnTechUser = false,
  isAnchorMaker = false,
  isAnchorChecker = false,
  isDealerMaker = false,
  isDealerChecker = false,
}) => {
  const showCashnTechLayout =
    isCashnTechUser ||
    isAnchorMaker ||
    isAnchorChecker ||
    isDealerMaker ||
    isDealerChecker;

  if (loading) {
    return (
      <View style={styles.verticalList}>
        <SkeletonList variant="grid" count={3} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.verticalList,
          {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: scaleHeight(40),
          },
        ]}>
        <Text style={styles.noDataText}>{error}</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View
        style={[
          styles.verticalList,
          {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: scaleHeight(40),
          },
        ]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.verticalList}>
      {data.map((row, index) => {
        const availableLimit =
          (Number(row.drawing_power) || Number(row.sanctioned_limit) || 0) -
          (Number(row.utilized_amount) || 0);

        return (
          <TouchableOpacity
            key={`${row.id || 'row'}-${index}`}
            activeOpacity={0.7}
            onPress={() =>
              onDealerPress(row.id, row.dealer_no || row.od_account_no || '')
            }>
            <View style={styles.listCard}>
              {showCashnTechLayout ? (
                <>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.infoGrid}>
                    <View
                      style={[
                        styles.infoColumn,
                        {width: '100%', marginBottom: scaleHeight(6)},
                      ]}>
                      <Text style={styles.infoLabel}>Program Name</Text>
                      <Text style={styles.infoValue}>
                        {displayText(row.program_name)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Primary Party</Text>
                      <Text style={styles.infoValue}>
                        {displayText(row.partyName)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Counter Party</Text>
                      <Text style={styles.infoValue}>
                        {displayText(
                          row.counterPartyName || row.dealer_name || null,
                        )}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Loan/OD Account</Text>
                      <Text style={styles.infoValue}>
                        {displayText(row.od_account_no)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Sanction Limit (₹)</Text>
                      <Text style={styles.infoValue}>
                        {formatInr(row.sanctioned_limit)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Drawing Power (₹)</Text>
                      <Text style={styles.infoValue}>
                        {formatInr(row.drawing_power)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Utilized Amount (₹)</Text>
                      <Text style={styles.infoValue}>
                        {formatInr(row.utilized_amount)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Pipeline Requests (₹)</Text>
                      <Text style={styles.infoValue}>
                        {formatInr(row.pipeline_requests)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Available Limit (₹)</Text>
                      <Text style={styles.infoValue}>
                        {formatInr(availableLimit)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Overdue Amount (₹)</Text>
                      <Text style={[styles.infoValue, {color: Colors.red}]}>
                        {formatInr(row.overdue_amount)}
                      </Text>
                    </View>

                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>DPD Days</Text>
                      <Text style={styles.infoValue}>
                        {row.dpd_days == null ? '-' : String(row.dpd_days)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Sanctioned Limit</Text>
                    <Text style={styles.infoValue}>
                      {formatInr(row.sanctioned_limit)}
                    </Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Utilized Amount</Text>
                    <Text style={styles.infoValue}>
                      {formatInr(row.utilized_amount)}
                    </Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Overdue Amount</Text>
                    <Text style={[styles.infoValue, {color: Colors.red}]}>
                      {formatInr(row.overdue_amount)}
                    </Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>DPD Days</Text>
                    <Text style={styles.infoValue}>
                      {row.dpd_days == null ? '-' : String(row.dpd_days)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
