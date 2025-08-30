/* eslint-disable @typescript-eslint/no-unused-vars */
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import {AppBar, Container} from '@components/index';
import {HomeNavigatorType, ClientNavigatorType} from '@type/NavigatorTypes';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {LeftChevronCircle} from '@assets/Icons';
import Colors from '@constants/Colors';
import {scaleFont} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';

type NavigationType = CompositeNavigationProp<
  NativeStackNavigationProp<ClientNavigatorType>,
  DrawerNavigationProp<HomeNavigatorType>
>;

export const ClientDetailsScreen = () => {
  const navigation = useNavigation<NavigationType>();

  return (
    <Container>
      <AppBar title="Client Information Master" navigation={navigation} />
      <View style={styles.subcontainer}>
        <Text style={styles.subheader}>Client Information</Text>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  subcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LimeGray,
    paddingLeft: 16,
    paddingVertical: 12,
  },
  subheader: {
    marginLeft: 12,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: '#333',
  },
});
