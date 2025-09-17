/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import React, {useState} from 'react';
import {AppBar, Container, RulesetTCPDCard} from '@components/index';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {LeftChevronCircle} from '@assets/Icons';
import FontWeight from '@constants/FontWeight';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type RulesetTCPD = {
  bankName: string;
  productName: string;
  methodName: string;
  monthlyTurnover: string;
  sanctionRequested: string;
  eligibiltyAmount: string;
};

export const RulesetTCPD = () => {
  const navigation = useNavigation<SoftInfoNavigationType>();
  const [search, setSearch] = useState<string>('');

  const leads: RulesetTCPD[] = [
    {
      bankName: 'Urgo',
      productName: 'PID',
      methodName: 'Turnover Method',
      monthlyTurnover: '20,00,000',
      sanctionRequested: '50,00,000',
      eligibiltyAmount: '50,00,000',
    },
    {
      bankName: 'Urgo',
      productName: 'PID',
      methodName: 'Turnover Method',
      monthlyTurnover: '20,00,000',
      sanctionRequested: '50,00,000',
      eligibiltyAmount: '50,00,000',
    },
    {
      bankName: 'Urgo',
      productName: 'PID',
      methodName: 'Turnover Method',
      monthlyTurnover: '20,00,000',
      sanctionRequested: '50,00,000',
      eligibiltyAmount: '50,00,000',
    },
  ];

  const filteredLeads = leads.filter(lead =>
    lead.bankName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Container>
      <AppBar title="Soft Sanction" navigation={navigation} />

      {/* Content */}
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Soft Sanction Ruleset</Text>
      </View>
      <View>
        <TouchableOpacity
          style={styles.Content}
          onPress={() => navigation.goBack()}>
          <LeftChevronCircle height={20} width={20} />
          <Text style={styles.contentText}>Rulesets (TCPD0001)</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.subHeading}>
        <Text style={styles.subHeadingText}>XYZ Company PVT. LTD</Text>
        <Text style={styles.bodyText}>Ahmedabad, Gujarat</Text>
      </View>
      <View style={styles.container}>
        <FlatList
          data={filteredLeads}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('UGROTurnoverMethod', {
                clientId: '1',
                method: item.methodName,
                bank: item.bankName,
              })}>
              <RulesetTCPDCard RulesetTCPD={item} />
            </TouchableOpacity>
          )}
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
  subHeading: {
    padding: 16,
  },
  subHeadingText: {
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
    marginBottom: scaleHeight(12),
    color: Colors.gray500,
  },
  bodyText: {
    fontSize: scaleFont(12),
    fontWeight: fontWeight.Medium,
    color: Colors.gray300,
  },
});
