import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';

type RulesetViewProps = {
  RulesetView: {
    basis: string;
    creditperiod: string;
    methodName: string;
    tpwAmount: string;
    finallimit: string;
    
  };
};

export const RulesetViewCard: React.FC<RulesetViewProps> = ({RulesetView: RulesetView}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        <Text style={styles.label}>Method Name :</Text> {RulesetView.methodName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Basis :</Text>
        {RulesetView.basis}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Credit Period :</Text> {RulesetView.creditperiod}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Final Limit :</Text>
        {RulesetView.finallimit}
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
