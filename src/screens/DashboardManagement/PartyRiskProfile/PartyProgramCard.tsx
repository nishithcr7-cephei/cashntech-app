import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {dpdText, formatCr, pct} from '@utils/riskFormat';
import type {PartyRiskProgram} from '@store/riskDashboard/riskDashboard.types';
import {StatusPill} from '../components/StatusPill';

export const PartyProgramCard: React.FC<{program: PartyRiskProgram}> = ({program}) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.titleBox}>
        <Text style={styles.name} numberOfLines={2}>
          {program.programName || '-'}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[program.bankName, program.product, program.role && `as ${program.role.toLowerCase()}`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <StatusPill label={program.status} />
    </View>
    <View style={styles.metricsRow}>
      <Metric label="Limit" value={formatCr(program.limit)} />
      <Metric label="Outstanding" value={formatCr(program.outstanding)} />
      <Metric label="DPD" value={dpdText(program.currentDpd)} danger={program.currentDpd > 0} />
      <Metric
        label="Utilisation"
        value={`${Math.round(pct(program.outstanding, program.limit))}%`}
      />
    </View>
  </View>
);

const Metric: React.FC<{label: string; value: string; danger?: boolean}> = ({
  label,
  value,
  danger,
}) => (
  <View style={styles.metric}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, danger && styles.danger]} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
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
  headerRow: {flexDirection: 'row', alignItems: 'flex-start'},
  titleBox: {flex: 1, minWidth: 0, marginRight: scaleWidth(8)},
  name: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  meta: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  metricsRow: {flexDirection: 'row', marginTop: scaleHeight(10)},
  metric: {flex: 1, marginRight: scaleWidth(4)},
  label: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  value: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  danger: {color: '#B5442F'},
});
