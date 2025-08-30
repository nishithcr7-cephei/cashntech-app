import React from 'react';
import {LogoImg} from '@assets/Images';
import {Image, StyleSheet} from 'react-native';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {Container} from '@components/index';

export const SplashScreen = () => {
  return (
    <Container style={styles.container}>
      <Image source={LogoImg} style={styles.logo} />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: scaleWidth(215),
    height: scaleHeight(53.5),
    resizeMode: 'contain',
  },
});
