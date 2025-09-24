import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ScrollView} from 'react-native-gesture-handler';

import {AppBar, Container, CustomDropdown, Input} from '@components/index';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import Fonts from '@constants/Fonts';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';

const organisationTypes = [
  {label: 'Private Limited', value: 'private_limited'},
  {label: 'Public Limited', value: 'public_limited'},
  {label: 'Partnership', value: 'partnership'},
  {label: 'Sole Proprietorship', value: 'sole_proprietorship'},
  {label: 'LLP (Limited Liability Partnership)', value: 'llp'},
  {label: 'Non-Profit Organisation', value: 'non_profit'},
];

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

export const DocValidForm = () => {
  const navigation = useNavigation<DocNavigationType>();

  return (
    <Container>
      <AppBar title="Document Validation" navigation={navigation} />

      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Document Validation</Text>
      </View>
      <ScrollView>
        <View style={styles.container}>
          <Text style={[styles.subTitle, {marginBottom: scaleHeight(10)}]}>
            Lead Confirmation
          </Text>
          <Input
            label="Lead ID"
            containerStyle={{marginTop: scaleHeight(16)}}
          />
          <Input
            label="Lead Name"
            containerStyle={{marginTop: scaleHeight(20)}}
          />
          <CustomDropdown
            label="Type of Organisation"
            data={organisationTypes}
            containerStyle={{marginTop: scaleHeight(20)}}
          />
          <Input
            label="Mobile Number"
            containerStyle={{marginTop: scaleHeight(20)}}
          />
          <Input
            label="Email ID"
            containerStyle={{marginTop: scaleHeight(20)}}
          />
          <Input
            label="PAN Number"
            containerStyle={{marginTop: scaleHeight(20)}}
          />
          <Input
            label="GST Number"
            containerStyle={{marginTop: scaleHeight(20)}}
          />
          <Input
            label="Address"
            containerStyle={{marginTop: scaleHeight(20)}}
          />

          <Text style={[styles.subTitle, {marginVertical: scaleHeight(20)}]}>
            Co Applicant Detail
          </Text>
          <Input label="Name" containerStyle={{marginTop: scaleHeight(10)}} />
          <Input
            label="PAN Number"
            containerStyle={{marginTop: scaleHeight(20)}}
          />
          <Input
            label="Adhar Number"
            containerStyle={{marginTop: scaleHeight(20)}}
          />
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity style={styles.clearButton}>
            <Text style={styles.clearText}>Edit</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.saveButton, {backgroundColor: Colors.white}]}
              activeOpacity={0.7}>
              <Text style={[styles.saveText, {color: Colors.graybase}]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {backgroundColor: Colors.white},
                {borderColor: Colors.green},
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('DocValidSelection')}>
              <Text style={styles.saveText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  container: {
    padding: 24,
  },
  subTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
  },
  footerButton: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  clearButton: {},
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    gap: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.gray500,
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.green,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
});
