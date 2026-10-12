import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {dpdText, formatInr, formatRiskDate} from '@utils/riskFormat';
import type {AlertDispatchRow} from '@store/riskDashboard/riskDashboard.types';
import {StatusPill} from '../components/StatusPill';
import {StatusRows} from '../components/StatusRow';
import {enumLabel} from './alertFilters';

type Props = {row: AlertDispatchRow};

/** Read-only alert dispatch; case/action management stays on web. */
export const AlertCard: React.FC<Props> = React.memo(({row}) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.titleBox}>
        <Text style={styles.party} numberOfLines={2}>
          {row.monitoredParty || '-'}
        </Text>
        <Text style={styles.program} numberOfLines={2}>
          {row.program || '-'}
        </Text>
      </View>
      <StatusPill label={row.statusLabel} />
    </View>

    <Text style={styles.trigger} numberOfLines={1}>
      {[row.triggerCode, formatRiskDate(row.crossingDate)]
        .filter(Boolean)
        .join(' · ')}
    </Text>

    <View style={styles.metricsRow}>
      <Metric
        label="Max DPD"
        value={dpdText(row.maxDpd)}
        valueColor={row.maxDpd > 0 ? '#B5442F' : undefined}
      />
      <Metric label="Outstanding" value={formatInr(row.totalOutstanding)} />
      <Metric label="Invoices" value={String(row.invoiceCount)} />
    </View>

    {row.caseStatus || row.actionStatus ? (
      <StatusRows
        items={[
          ...(row.caseStatus ? [{label: 'Case', value: enumLabel(row.caseStatus)}] : []),
          ...(row.actionStatus
            ? [{label: 'Action', value: enumLabel(row.actionStatus)}]
            : []),
        ]}
      />
    ) : null}
  </View>
));

const Metric: React.FC<{label: string; value: string; valueColor?: string}> = ({
  label,
  value,
  valueColor,
}) => (
  <View style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text
      style={[styles.metricValue, valueColor ? {color: valueColor} : null]}
      numberOfLines={1}>
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
  party: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  program: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  trigger: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: scaleHeight(10),
  },
  metric: {flex: 1, minWidth: 0},
  metricLabel: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(2),
  },
  metricValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
});
