import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatCr} from '@utils/riskFormat';
import type {BankProductSummary} from '@store/riskDashboard/riskDashboard.types';

/** One product block on Bank Risk Detail ("Purchase Invoice Discounting · 2 programs"). */
export const ProductSummaryCard: React.FC<{summary: BankProductSummary}> = ({
  summary,
}) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <Text style={styles.title} numberOfLines={2}>
        {summary.product}
      </Text>
      <Text style={styles.programs}>
        {summary.programCount} program{summary.programCount === 1 ? '' : 's'}
      </Text>
    </View>
    {summary.monitoredPartyType ? (
      <Text style={styles.caption}>{summary.monitoredPartyType}</Text>
    ) : null}
    <View style={styles.metrics}>
      <Metric label="Outstanding" value={formatCr(summary.outstanding)} />
      <Metric
        label="At risk"
        value={summary.atRisk > 0 ? formatCr(summary.atRisk) : '—'}
      />
      <Metric label="Flagged" value={String(summary.flaggedParties)} />
    </View>
  </View>
);

const Metric: React.FC<{label: string; value: string}> = ({label, value}) => (
  <View style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: scaleWidth(12),
    marginBottom: scaleHeight(8),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  programs: {
    marginLeft: scaleWidth(8),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
  },
  caption: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  metrics: {
    flexDirection: 'row',
    marginTop: scaleHeight(8),
  },
  metric: {marginRight: scaleWidth(20)},
  metricLabel: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  metricValue: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
});
