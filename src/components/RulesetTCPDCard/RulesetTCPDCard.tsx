import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';

type RulesetTCPDProps = {
  RulesetTCPD: {
    bankName: string;
    productName: string;
    methodName: string;
    monthlyTurnover: string;
    sanctionRequested: string;
    eligibiltyAmount: string;
  };
};

export const RulesetTCPDCard: React.FC<RulesetTCPDProps> = ({RulesetTCPD}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        <Text style={styles.label}>Bank Name :</Text> {RulesetTCPD.bankName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Product Name :</Text>
        {RulesetTCPD.productName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Method Name :</Text> {RulesetTCPD.methodName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Monthly Turnover :</Text>
        {RulesetTCPD.monthlyTurnover}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Sanction Requested :</Text>
        {RulesetTCPD.sanctionRequested}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Eligibilty Amount :</Text>
        {RulesetTCPD.eligibiltyAmount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.LimeGray,
    marginVertical: 10,
    padding: 16,
    borderRadius: 8,
    borderColor: '#eee',
    borderWidth: 1,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  text: {
    color: '#555',
    marginBottom: 4,
  },
  button: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'red',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'red',
    fontWeight: '600',
  },
});
