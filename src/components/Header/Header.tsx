import {LogoImg} from '@assets/Images';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React from 'react';
import {Image, View, StyleSheet, Text} from 'react-native';

export type HeaderProps = {
  title?: string;
  subtitle?: string;
  customSubtitle?: React.ReactNode;
};

export const Header: React.FC<HeaderProps> = ({
  title = '',
  subtitle = '',
  customSubtitle,
}) => {
  return (
    <View>
      <View style={styles.headerContainer}>
        <Image source={LogoImg} style={styles.logo} />
      </View>
      <View style={styles.subtitleContainer}>
        {title.length > 0 && <Text style={styles.title}>{title}</Text>}
        {!customSubtitle && subtitle.length > 0 && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
        {customSubtitle}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'contain',
    width: scaleWidth(110),
    height: scaleHeight(28),
    marginTop: scaleHeight(16),
  },
  title: {
    fontSize: scaleFont(16),
    color: Colors.gray,
    fontFamily: Fonts.GilroyMedium,
  },
  subtitle: {
    marginTop: scaleHeight(8),
    fontSize: scaleFont(12),
    color: Colors.lightGray,
    fontFamily: Fonts.GilroySemiBold,
  },
  subtitleContainer: {
    marginTop: scaleHeight(50),
    marginHorizontal: scaleWidth(32),
  },
});
