import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import Colors from '@constants/Colors';
import {Download} from '@assets/Icons';

type TurnoverMethodProps = {
  TurnoverMethod: {
    monthlyTurnover: string;
    last12MTurnover: string;
    projectedTurnover: string;
    creditPeriodOffered: string;
    projectedTO: string;
    projectedTOforCreditPeriod: string;
    existingWCLimits: string;
    finalLimit: string;
    actualEligibility: string;
    eligibilityasperTenor: string;
  };
};

export const TurnoverMethodCard: React.FC<TurnoverMethodProps> = ({
  TurnoverMethod,
}) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.icon}>
        <Download width={14} height={14} />
      </TouchableOpacity>

      {[
        {label: 'Monthly Turnover', value: TurnoverMethod.monthlyTurnover},
        {label: 'Last 12 M Turnover', value: TurnoverMethod.last12MTurnover},
        {label: 'Projected Turnover', value: TurnoverMethod.projectedTurnover},
        {
          label: 'CREDIT PERIOD Offered',
          value: TurnoverMethod.creditPeriodOffered,
        },
        {label: '20% of Projected TO', value: TurnoverMethod.projectedTO},
        {
          label: 'Projected TO for credit period',
          value: TurnoverMethod.projectedTOforCreditPeriod,
        },
        {label: 'Existing W/C Limits', value: TurnoverMethod.existingWCLimits},
        {label: 'Final Limit', value: TurnoverMethod.finalLimit},
        {label: 'Actual Eligibility', value: TurnoverMethod.actualEligibility},
        {
          label: 'Eligibility as per Tenor',
          value: TurnoverMethod.eligibilityasperTenor,
        },
      ].map((item, index) => (
        <Text style={styles.text} key={index}>
          <Text style={styles.label}>{item.label}: </Text>
          {item.value}
        </Text>
      ))}
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
