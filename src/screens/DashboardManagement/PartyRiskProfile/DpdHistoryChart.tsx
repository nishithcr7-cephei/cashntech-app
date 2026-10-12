import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import type {PartyDpdHistoryPoint} from '@store/riskDashboard/riskDashboard.types';

const CHART_HEIGHT = scaleHeight(90);
/** Keeps small DPD values from filling the whole chart. */
const MIN_SCALE_DPD = 30;

const barColor = (dpd: number): string =>
  dpd >= 90 ? '#8A2A1E' : dpd >= 61 ? '#B5442F' : dpd >= 8 ? '#C8743A' : dpd >= 1 ? '#D6A24A' : '#C8CDD4';

/**
 * Peak DPD per month. The backend only returns months that have DPD data,
 * so fewer than 12 bars is expected.
 */
export const DpdHistoryChart: React.FC<{history: PartyDpdHistoryPoint[]}> = ({
  history,
}) => {
  const maxDpd = Math.max(MIN_SCALE_DPD, ...history.map(h => h.dpd));
  return (
    <View style={styles.card}>
      <View style={styles.chart}>
        {history.map((point, index) => (
          <View key={`${point.month}-${index}`} style={styles.column}>
            <Text style={styles.value}>{point.dpd > 0 ? point.dpd : '—'}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(2, (point.dpd / maxDpd) * CHART_HEIGHT),
                  backgroundColor: barColor(point.dpd),
                },
              ]}
            />
            <Text style={styles.month}>{point.month}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.caption}>Peak DPD per month</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scaleWidth(12),
    marginBottom: scaleHeight(8),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: CHART_HEIGHT + scaleHeight(32),
  },
  column: {flex: 1, alignItems: 'center', justifyContent: 'flex-end'},
  bar: {
    width: '60%',
    maxWidth: scaleWidth(18),
    borderTopLeftRadius: scaleWidth(3),
    borderTopRightRadius: scaleWidth(3),
  },
  value: {
    marginBottom: scaleHeight(2),
    fontSize: scaleFont(9),
    fontFamily: Fonts.GilroySemiBold,
    color: '#252C32',
  },
  month: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(9),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  caption: {
    marginTop: scaleHeight(6),
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
