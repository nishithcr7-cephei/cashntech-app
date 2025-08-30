import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {Download} from '@assets/Icons';
import Colors from '@constants/Colors';

type PurchaseMethodProps = {
  PurchaseMethod: {
    lastMPurchaseasofBrand: string;
    creditPeriodOffered: string;
    limitCalculation: string;
    dependancy: string;
    existingWCLimits: string;
    finalLimit: string;
  };
};

export const PurchaseMethodCard: React.FC<PurchaseMethodProps> = ({
  PurchaseMethod,
}) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.icon}>
        <Download width={14} height={14} />
      </TouchableOpacity>
      <Text style={styles.text}>
        <Text style={styles.label}>
          Last 12 M Purchaseas of brand 1 (GSTMar24) :{' '}
        </Text>
        {PurchaseMethod.lastMPurchaseasofBrand}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>CREDIT PERIOD Offered: </Text>
        {PurchaseMethod.creditPeriodOffered}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Limit Calculation : </Text>
        {PurchaseMethod.limitCalculation}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Dependancy : </Text>
        {PurchaseMethod.dependancy}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Existing W/C Limits: </Text>
        {PurchaseMethod.existingWCLimits}
      </Text>
      <Text style={styles.text}>
        <Text style={styles.label}>Final Limit: </Text>
        {PurchaseMethod.finalLimit}
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
  icon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
});
