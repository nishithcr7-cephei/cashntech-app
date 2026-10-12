import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatCr} from '@utils/riskFormat';
import type {DpdBucket} from '@store/riskDashboard/riskDashboard.types';

const EMPTY_BAR_COLOR = '#C8CDD4';

/** "Outstanding by DPD" — one stacked bar + legend; buckets and colours come from the backend. */
export const DpdStackedBar: React.FC<{buckets: DpdBucket[]}> = ({buckets}) => {
  const total = buckets.reduce((sum, b) => sum + (b.amount > 0 ? b.amount : 0), 0);
  const filled = buckets.filter(b => b.amount > 0);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>OUTSTANDING BY DPD</Text>
        <Text style={styles.total}>{formatCr(total)} outstanding</Text>
      </View>

      <View style={styles.bar}>
        {filled.length ? (
          filled.map(b => (
            <View
              key={b.label}
              style={{flex: b.amount, backgroundColor: b.color || EMPTY_BAR_COLOR}}
            />
          ))
        ) : (
          <View style={[styles.flex1, {backgroundColor: EMPTY_BAR_COLOR}]} />
        )}
      </View>

      <View style={styles.legend}>
        {buckets.map(b => (
          <View key={b.label} style={styles.legendItem}>
            <View style={[styles.dot, {backgroundColor: b.color || EMPTY_BAR_COLOR}]} />
            <Text style={styles.legendLabel}>{b.label}</Text>
            <Text style={styles.legendValue}>
              {b.amount > 0 ? formatCr(b.amount) : '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    letterSpacing: 0.8,
    color: '#5B6470',
  },
  total: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
  },
  bar: {
    flexDirection: 'row',
    height: scaleHeight(10),
    marginTop: scaleHeight(10),
    borderRadius: scaleWidth(5),
    overflow: 'hidden',
  },
  flex1: {flex: 1},
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleHeight(10),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: scaleHeight(6),
  },
  dot: {
    width: scaleWidth(9),
    height: scaleWidth(9),
    borderRadius: scaleWidth(2),
    marginRight: scaleWidth(6),
  },
  legendLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
    marginRight: scaleWidth(4),
  },
  legendValue: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
});
