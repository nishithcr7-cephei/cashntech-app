import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ScrollView} from 'react-native-gesture-handler';

import {AppBar, Container, PersonalKYCValidationCard} from '@components/index';
import {LeftChevronCircle} from '@assets/Icons';
import {HomeNavigatorType, ClientNavigatorType} from '@type/NavigatorTypes';
import Colors from '@constants/Colors';
import {scaleFont} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';

type NavigationType = CompositeNavigationProp<
  NativeStackNavigationProp<ClientNavigatorType>,
  DrawerNavigationProp<HomeNavigatorType>
>;

const BKYCVData = [
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
    status: '-',
  },
  {
    documentName: 'PAN Card',
    nameasperPanCard: 'Lorem Ipsum',
    panNumber: 'BAJPC4350M',
    dateofBirth: '22-11-1993',
    status: '',
  },
];

export const BusinessKYCValidation = () => {
  const navigation = useNavigation<NavigationType>();

  return (
    <Container>
      <AppBar title="Document Validation" navigation={navigation} />

      {/* Subheader Section */}
      <View>
        <TouchableOpacity
          style={styles.subcontainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>Business KYC Validation</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.Cardlist}>
            <FlatList
              data={BKYCVData}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({item}) => <PersonalKYCValidationCard {...item} />}
              contentContainerStyle={{flexGrow: 1}}
            />
          </View>
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