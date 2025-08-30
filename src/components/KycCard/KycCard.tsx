/* eslint-disable @typescript-eslint/no-unused-vars */
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import Colors from '@constants/Colors';
import {useNavigation} from '@react-navigation/native';
import {IClientInfoResponseDatum} from '@store/client';
import {decryptLocation, decryptConditionally} from '@utils/crypto';

interface String {
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

type KycCardProps = {
  data: IClientInfoResponseDatum;
};

export const KycCard: React.FC<KycCardProps> = ({data}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.card}>
      {/* <View
        style={[styles.statusBadge, {backgroundColor: ChipColors['Complete']}]}>
        <Text style={styles.statusText}>{'Complete'}</Text>
      </View> */}

      {[
        {label: 'Client Id', value: data.id},
        {label: 'Client Name', value: decryptLocation(data.client_name)},
        {label: 'City', value: decryptConditionally(data.city)},
        {
          label: 'Initiator',
          value: 'ToDoInitiator',
        },
        {label: 'Source (D/H/C/O)', value: data.source_of_lead},
        {
          label: 'Reference Details',
          value: 'ToDO Reference Details',
        },
        {label: 'Monthly Turnover', value: data.monthly_turnover},
        {label: 'Eligibility Amount :', value: data.estimated_funding_required},
        {label: 'Intent', value: 'ToDo Intent'},
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
