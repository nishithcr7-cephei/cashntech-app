/* eslint-disable @typescript-eslint/no-unused-vars */
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';
import {useNavigation} from '@react-navigation/native';

interface DocCardProps {
  clientId: string;
  clientName: string;
  location: string;
  initiator: string;
  sourceDHCO: string;
  referenceDetails: string;
  monthlyTurnover: string;
  eligibiltyAmount: string;
  intent: string;
  status: 'Complete' | 'Pending';
}

const ChipColors = {
  Complete: Colors.green,
  Pending: Colors.primaryColor,
};

export const DocValidCard: React.FC<DocCardProps> = ({
  clientId,
  clientName,
  location,
  initiator,
  sourceDHCO,
  referenceDetails,
  monthlyTurnover,
  eligibiltyAmount,
  intent,
  status,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.card}>
      {/* <View style={[styles.statusBadge, {backgroundColor: ChipColors[status]}]}>
        <Text style={styles.statusText}>{status}</Text>
      </View> */}

      {[
        {label: 'Client Id', value: clientId},
        {label: 'Client Name', value: clientName},
        {label: 'Location', value: location},
        {
          label: 'Initiator',
          value: initiator,
        },
        {label: 'Source (D/H/C/O)', value: sourceDHCO},
        {
          label: 'Reference Details',
          value: referenceDetails,
        },
        {label: 'Monthly Turnover', value: monthlyTurnover},
        {label: 'Eligibility Amount :', value: eligibiltyAmount},
        {label: 'Intent', value: intent},
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
  statusBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#FFFFFF',
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
