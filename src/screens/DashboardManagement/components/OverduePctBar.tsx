import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

/** Same thresholds as the backend health status: ≥12 Elevated, ≥6 Watch. */
const barColor = (value: number): string =>
  value >= 12 ? '#B5442F' : value >= 6 ? '#D6A24A' : '#3B9B5B';

export const OverduePctBar: React.FC<{value: number}> = ({value}) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {width: `${clamped}%`, backgroundColor: barColor(value)},
          ]}
        />
      </View>
      <Text style={styles.text}>{value.toFixed(1)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center'},
  track: {
    flex: 1,
    height: scaleHeight(6),
    borderRadius: scaleWidth(3),
    backgroundColor: '#EEF0F3',
    overflow: 'hidden',
  },
  fill: {height: '100%'},
  text: {
    width: scaleWidth(44),
    marginLeft: scaleWidth(8),
    textAlign: 'right',
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: '#252C32',
  },
});
