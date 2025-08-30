/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {AppBar, Container, DocValidCard} from '@components/index';
import {Filter, Search} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';

const DocData = [
  {
    clientId: '0001',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Complete',
  },
  {
    clientId: '0002',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Pending',
  },
  {
    clientId: '0003',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Complete',
  },
  {
    clientId: '0004',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Pending',
  },
] as const;

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

export const DocumentValidation = () => {
  const navigation = useNavigation<DocNavigationType>();

  return (
    <Container>
      <AppBar title="Document Validation" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Document Validation</Text>
      </View>
      <View style={styles.RowContainer}>
        <View style={styles.Subrowcontainer}>
          <Text style={styles.Subrowcontainertxt}>Leads</Text>
          <View style={styles.Badge}>
            <Text style={styles.Badgetext}>{DocData.length}</Text>
          </View>
        </View>
        <View style={styles.Searchbox}>
          <Search height={12} width={12} />
          <TextInput
            style={styles.input}
            placeholder="Search Leads"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.Filterbox}>
          <View>
            <Filter height={12} width={12} />
          </View>
        </View>
      </View>
      <View style={styles.Cardlist}>
        <FlatList
          data={DocData}
          keyExtractor={item => item.clientId}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('DocValidForm')}>
              <DocValidCard {...item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{flexGrow: 1}}
        />
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
  RowContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  Subrowcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  Subrowcontainertxt: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.darkblack,
  },
  Badge: {
    backgroundColor: Colors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  Badgetext: {
    color: Colors.SteelGray,
  },
  Searchbox: {
    flex: 1,
    flexDirection: 'row',
    height: scaleHeight(29),
    marginLeft: 5,
    marginTop: 2,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderWidth: 1,
    borderRadius: 3,
    gap: 16,
    paddingHorizontal: 10,
  },
  input: {
    fontSize: scaleFont(12),
  },
  Filterbox: {
    width: scaleWidth(32),
    height: scaleHeight(30),
    backgroundColor: Colors.primaryColor,
    marginLeft: scaleWidth(8),
    padding: 10,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Cardlist: {
    flex: 1,
    padding: 16,
  },
  plusButton: {
    position: 'absolute',
    bottom: scaleHeight(60),
    right: 30,
    backgroundColor: Colors.tertiaryBlue,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
