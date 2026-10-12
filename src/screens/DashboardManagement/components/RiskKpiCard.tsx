import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type RiskKpi = {
  key: string;
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
};

/** Two-column grid of KPI tiles (title / value / subtitle). */
export const RiskKpiGrid: React.FC<{items: RiskKpi[]}> = ({items}) => (
  <View style={styles.grid}>
    {items.map(item => (
      <View key={item.key} style={styles.card}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text
          style={[styles.value, item.valueColor ? {color: item.valueColor} : null]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {item.value}
        </Text>
        {item.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48.5%',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(10),
    marginBottom: scaleHeight(8),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
  },
  value: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  subtitle: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
