import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {AppBar, Container} from '@components/index';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {Fonts} from '@constants/index';
import {RightChevron} from '@assets/Icons';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

export const Softsanction = () => {
  const bodyText =
    'The Soft Sanction Process involves evaluating key parameters such as the CIBIL score, existing sanctioned amount, and estimated funding required to determine a rough eligibility amount for each lead.';
  const navigation = useNavigation<SoftInfoNavigationType>();
  return (
    <Container>
      <AppBar title="Soft Sanction" navigation={navigation} />

      {/* Content */}
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Soft Sanction</Text>
      </View>

      <View style={styles.TextContainer}>
        <Text style={styles.bodyText} numberOfLines={0}>
          {bodyText}
        </Text>
      </View>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('SoftsanctionProcess')}>
          <Text style={styles.text}>Soft Sanction Process</Text>
          <RightChevron height={17} width={20} />
        </TouchableOpacity>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  Subcontainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  TextContainer: {
    padding: scaleHeight(16),
    marginTop: scaleHeight(15),
  },
  bodyText: {
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(16),
    lineHeight: 23,
    letterSpacing: 0.6,
    color: Colors.blueGray700,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 1,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBCED5',
  },
  text: {
    fontSize: scaleFont(14),
    color: Colors.gray500,
  },
});
