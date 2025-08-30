/* eslint-disable react-native/no-inline-styles */
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import React from 'react';
import {AppBar, Container, PersonalKYCValidationCard} from '@components/index';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {LeftChevronCircle} from '@assets/Icons';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, ClientNavigatorType} from '@type/NavigatorTypes';
import Colors from '@constants/Colors';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {ScrollView} from 'react-native-gesture-handler';
import fontWeight from '@constants/FontWeight';

type NavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<ClientNavigatorType, 'FormSelectionScreen'>
>;

const PKYCVData = [
  {
    documentName: 'PAN Card',
    nameasperPanCard: 'Lorem Ipsum',
    panNumber: 'BAJPC4350M',
    dateofBirth: '22-11-1993',
    status: '-',
  },
  {
    documentName: 'PAN Card',
    nameasperPanCard: 'Lorem Ipsum',
    panNumber: 'BAJPC4350M',
    dateofBirth: '22-11-1993',
    status: 'Validate',
  },
];

const CAKYCVData = [
  {
    documentName: 'PAN Card',
    nameasperPanCard: 'Lorem Ipsum',
    panNumber: 'BAJPC4350M',
    dateofBirth: '22-11-1993',
    status: 'In Progress',
  },
  {
    documentName: 'PAN Card',
    nameasperPanCard: 'Lorem Ipsum',
    panNumber: 'BAJPC4350M',
    dateofBirth: '22-11-1993',
    status: '',
  },
];

export const PersonalKYCValidation = () => {
  const navigation = useNavigation<NavigationType>();

  return (
    <Container>
      <AppBar title="Document Validation" navigation={navigation} />

      <View>
        <TouchableOpacity
          style={styles.subcontainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>Personal KYC Validation</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.container}>
          <Text style={[styles.subTitle, {marginBottom: scaleHeight(20)}]}>
            Main Applicant KYC Validation
          </Text>
          <View style={styles.Cardlist}>
            <FlatList
              data={PKYCVData}
              keyExtractor={item => item.documentName}
              renderItem={({item}) => <PersonalKYCValidationCard {...item} />}
              contentContainerStyle={{flexGrow: 1}}
            />
          </View>

          <Text style={[styles.subTitle, {marginBottom: scaleHeight(20)}]}>
            Co Applicant KYC Validation
          </Text>
          <FlatList
            data={CAKYCVData}
            keyExtractor={item => item.documentName}
            renderItem={({item}) => <PersonalKYCValidationCard {...item} />}
            contentContainerStyle={{flexGrow: 1}}
          />
        </View>
      </ScrollView>
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
  container: {
    padding: 24,
  },
  subTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
  },
  Cardlist: {
    flex: 1,
  },
});
