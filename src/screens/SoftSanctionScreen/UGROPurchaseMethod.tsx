/* eslint-disable react-native/no-inline-styles */
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import React, {useState} from 'react';
import {scaleFont} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';
import {Colors, FontWeight} from '@constants/index';
import {LeftChevronCircle} from '@assets/Icons';
import {Container, AppBar} from '@components/index';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {PurchaseMethodCard} from '@components/UGRO-PurchaseMethod/PurchaseMethodCard';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type PurchaseMethod = {
  lastMPurchaseasofBrand: string;
  creditPeriodOffered: string;
  limitCalculation: string;
  dependancy: string;
  existingWCLimits: string;
  finalLimit: string;
};

export const UGROPurchaseMethod = () => {
  const navigation = useNavigation<SoftInfoNavigationType>();
  const [search] = useState<string>('');

  const leads: PurchaseMethod[] = [
    {
      lastMPurchaseasofBrand: '4,20,00,000',
      creditPeriodOffered: '45',
      limitCalculation: '51,78,082',
      dependancy: '0.80',
      existingWCLimits: '16,80,000',
      finalLimit: '34,98,082',
    },
  ];

  const filteredLeads = leads.filter(lead =>
    lead.lastMPurchaseasofBrand.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Container>
      <AppBar title="Soft Sanction" navigation={navigation} />

      {/* Content */}
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Soft Sanction</Text>
      </View>
      <View>
        <TouchableOpacity style={styles.Content} onPress={navigation.goBack}>
          <LeftChevronCircle height={20} width={20} />
          <Text style={styles.contentText}>
            UGRO - Purchase Method for XYZ {'\n'}Company PVT. LTD
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <FlatList
          data={filteredLeads}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({item}) => <PurchaseMethodCard PurchaseMethod={item} />}
          contentContainerStyle={{paddingBottom: 20}}
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
  Content: {
    margin: 15,
    flexDirection: 'row',
    gap: 8,
  },
  contentText: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
  },
  container: {
    padding: 16,
    flex: 1,
  },
});
