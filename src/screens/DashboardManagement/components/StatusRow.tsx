import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {StatusPill} from './StatusPill';

type Item = {label: string; value: string};

/** Label-left / pill-right rows; stays readable with long values and large font scales. */
export const StatusRows: React.FC<{items: Item[]}> = ({items}) => (
  <View style={styles.box}>
    {items.map(item => (
      <View
        key={item.label}
        style={styles.row}
        accessible
        accessibilityLabel={`${item.label}: ${item.value}`}>
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={styles.pillBox}>
          <StatusPill label={item.value} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  box: {
    marginTop: scaleHeight(10),
    paddingTop: scaleHeight(4),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E9EE',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(4),
  },
  label: {
    marginRight: scaleWidth(12),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  pillBox: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
});
