import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {dpdText, formatInr} from '@utils/riskFormat';
import type {BorrowerRiskRow} from '@store/riskDashboard/riskDashboard.types';
import {StatusPill} from '../components/StatusPill';
import {StatusRows} from '../components/StatusRow';
import {borrowerAlertLabel, stopSupplyLabel} from './borrowerFilters';

type Props = {row: BorrowerRiskRow};

/** Read-only distributor row; stop-supply / case actions stay on web. */
export const BorrowerRiskCard: React.FC<Props> = React.memo(({row}) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.titleBox}>
        <Text style={styles.name} numberOfLines={2}>
          {row.distributorName || '-'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {`${row.activeCompanies} ${row.activeCompanies === 1 ? 'company' : 'companies'} · ${row.activeBanks} ${row.activeBanks === 1 ? 'bank' : 'banks'}`}
        </Text>
      </View>
      <StatusPill label={row.riskCategory} />
    </View>

    <View style={styles.metricsRow}>
      <Metric label="Total Exposure" value={formatInr(row.totalExposure)} />
      <Metric
        label="Current DPD"
        value={dpdText(row.currentDpd)}
        valueColor={row.currentDpd > 0 ? '#B5442F' : undefined}
      />
    </View>

    <StatusRows
      items={[
        {label: 'Alert', value: borrowerAlertLabel(row.alertStatus)},
        {label: 'Stop Supply', value: stopSupplyLabel(row.stopSupplyStatus)},
        {label: 'Resolution', value: row.resolutionStatus},
      ]}
    />
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
  name: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  subtitle: {
    marginTop: scaleHeight(2),
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
    marginBottom: scaleHeight(3),
  },
  metricValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
});
