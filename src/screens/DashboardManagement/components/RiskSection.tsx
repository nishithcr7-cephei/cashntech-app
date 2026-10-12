import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type Props = {
  title: string;
  /** Shown instead of children when `isEmpty`. */
  emptyText?: string;
  isEmpty?: boolean;
  children?: React.ReactNode;
};

/** Uppercase section heading + bordered body, matching web panels. */
export const RiskSection: React.FC<Props> = ({
  title,
  emptyText = 'None',
  isEmpty,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>
    {isEmpty ? (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    ) : (
      children
    )}
  </View>
);

const styles = StyleSheet.create({
  section: {marginTop: scaleHeight(6), marginBottom: scaleHeight(6)},
  title: {
    marginBottom: scaleHeight(8),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    letterSpacing: 0.8,
    color: '#5B6470',
  },
  emptyBox: {
    paddingVertical: scaleHeight(14),
    alignItems: 'center',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  emptyText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
