import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';

type RulesetProps = {
  Ruleset: {
    bankName: string;
    productName: string;
    methodName: string;
    rulesetId: string;
    ruleName: string;
    rulestCondition: string;
  };
};

export const SoftRulestCard: React.FC<RulesetProps> = ({Ruleset}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        <Text style={styles.label}>Bank Name :</Text> {Ruleset.bankName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Product Name :</Text> {Ruleset.productName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Method Name :</Text> {Ruleset.methodName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Rulest ID :</Text> {Ruleset.rulesetId}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Rule Name :</Text> {Ruleset.ruleName}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Rulest Condition :</Text>
        {Ruleset.rulestCondition}
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
