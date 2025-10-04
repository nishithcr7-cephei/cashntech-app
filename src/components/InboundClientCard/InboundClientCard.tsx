import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';
import {scaleHeight, scaleWidth, scaleFont} from '@utils/Scale';
import {FontWeight} from '@constants/index';
import {decryptConditionally} from '@utils/crypto';

const Strings = {
  srNo: 'Sr.No:',
  registrationId: 'Registration ID:',
  firmName: 'Firm Name:',
  sector: 'Sector:',
  ownerName: 'Owner Name:',
  contactNumber: 'Contact Number:',
  city: 'City:',
  gstNumber: 'GST Number:',
  applicationStatus: 'Application Status:',
  registrationStatus: 'Registration Status:',
  overallStatus: 'Overall Status:',
};

export interface InboundClient {
  id: number;
  registration: string;
  name_of_client: string;
  contact_number: string;
}

export interface InboundApplicant {
  application_id: string;
  applied_for: string;
  cfa_invoice_file: string;
  application_status: string;
  overall_status: string;
  registration: string;
}

export interface InboundClientData {
  registration_id: string;
  sector: string;
  company_name: string;
  gst_number: string | null;
  gst_cert_file: string | null;
  city: string | null;
  registration_status: string | null;
  inboundClient: InboundClient[];
  inboundApplicants: InboundApplicant[];
}

type InboundClientCardProps = {
  data: InboundClientData;
  onPressCard: (clientData: InboundClientData) => void;
  srNo: number;
};

export const InboundClientCard: React.FC<InboundClientCardProps> = ({
  data,
  onPressCard,
  srNo,
}) => {
  const primaryClient = data.inboundClient[0]; // Get the first client as primary
  const primaryApplicant = data.inboundApplicants[0]; // Get the first applicant as primary
  
  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => onPressCard(data)}
        activeOpacity={0.7}>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.srNo}</Text> {srNo}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.registrationId}</Text> {data.registration_id}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.firmName}</Text> {decryptConditionally(data.company_name || '') || 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.sector}</Text> {data.sector}
        </Text>
        {primaryClient && (
          <>
            <Text style={styles.label}>
              <Text style={styles.bold}>{Strings.ownerName}</Text> {decryptConditionally(primaryClient.name_of_client || '') || 'N/A'}
            </Text>
            <Text style={styles.label}>
              <Text style={styles.bold}>{Strings.contactNumber}</Text> {decryptConditionally(primaryClient.contact_number || '') || 'N/A'}
            </Text>
          </>
        )}
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.city}</Text> {decryptConditionally(data.city || '') || 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.gstNumber}</Text> {decryptConditionally(data.gst_number || '') || 'N/A'}
        </Text>
        {primaryApplicant && (
          <Text style={styles.label}>
            <Text style={styles.bold}>{Strings.applicationStatus}</Text> {primaryApplicant.application_status}
          </Text>
        )}
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.registrationStatus}</Text> {data.registration_status ?? 'N/A'}
        </Text>
        {primaryApplicant && (
          <Text style={styles.label}>
            <Text style={styles.bold}>{Strings.overallStatus}</Text> {primaryApplicant.overall_status}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    color: '#666666',
    marginBottom: 6,
  },
  bold: {
    fontWeight: FontWeight.SemiBold,
    color: '#333333',
  },
});
