import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatCr, pct} from '@utils/riskFormat';
import type {EcosystemBankRow} from '@store/riskDashboard/riskDashboard.types';
import {StatusPill} from '../components/StatusPill';
import {OverduePctBar} from '../components/OverduePctBar';

type Props = {
  row: EcosystemBankRow;
  onPress: (row: EcosystemBankRow) => void;
};

export const EcosystemBankCard: React.FC<Props> = ({row, onPress}) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.7}
    onPress={() => onPress(row)}
    accessibilityRole="button"
    accessibilityLabel={`${row.bankName}, health ${row.healthStatus}. Open party risk profile.`}>
    <View style={styles.headerRow}>
      <View style={styles.titleBox}>
        <Text style={styles.bankName} numberOfLines={2}>
          {row.bankName}
        </Text>
        {row.products.length ? (
          <Text style={styles.products} numberOfLines={2}>
            {row.products.join(' · ')}
          </Text>
        ) : null}
      </View>
      <StatusPill label={row.healthStatus} />
    </View>

    <View style={styles.metricsRow}>
      <Metric label="Total Exposure" value={formatCr(row.totalExposure)} />
      <Metric
        label="Overdue Amount"
        value={formatCr(row.overdueAmount)}
        valueColor={row.overdueAmount > 0 ? '#B5442F' : undefined}
      />
    </View>

    <Text style={styles.metricLabel}>Overdue %</Text>
    <OverduePctBar value={pct(row.overdueAmount, row.totalExposure)} />

    <View style={styles.metricsRow}>
      <Metric label="Flagged Parties" value={String(row.flaggedParties)} />
      <Metric
        label="NPA Amount"
        value={row.npaAmount > 0 ? formatCr(row.npaAmount) : '—'}
        valueColor={row.npaAmount > 0 ? '#8A2A1E' : undefined}
      />
    </View>

    <View style={styles.footer}>
      <Text style={styles.footerText}>View parties</Text>
      <FontAwesome6
        name="chevron-right"
        iconStyle="solid"
        size={scaleFont(10)}
        color={Colors.primaryColor}
      />
    </View>
  </TouchableOpacity>
);

const Metric: React.FC<{label: string; value: string; valueColor?: string}> = ({
  label,
  value,
  valueColor,
}) => (
  <View style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, valueColor ? {color: valueColor} : null]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: scaleWidth(12),
    marginBottom: scaleHeight(10),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleBox: {flex: 1, minWidth: 0, marginRight: scaleWidth(8)},
  bankName: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  products: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: scaleHeight(10),
    marginBottom: scaleHeight(4),
  },
  metric: {flex: 1},
  metricLabel: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(2),
  },
  metricValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: scaleHeight(8),
  },
  footerText: {
    marginRight: scaleWidth(4),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
});
