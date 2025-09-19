import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import Colors from '@constants/Colors';
import {ILeadProgressResponseDatum} from '@store/lead';
import {decryptLocation, decryptConditionally} from '@utils/crypto';

interface LeadProgressProps {
  data: ILeadProgressResponseDatum;
  index: number;
  onPress: () => void;
}

const ChipColors = {
  Warm: '#FFC107',
  Hot: '#FF5656',
  Cold: Colors.tertiaryBlue,
};

export const LeadProgressCard: React.FC<LeadProgressProps> = ({
  data,
  index,
  onPress,
}) => {
  // Debug log for city field
  console.log('LeadProgressCard: City field debug:', {
    originalCity: data.city,
    decryptedCity: decryptConditionally(data.city),
    isEncrypted: /^[A-Za-z0-9+/=]+$/.test(data.city || '') && (data.city || '').length > 20
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* <View style={[styles.statusBadge, {backgroundColor: ChipColors.Warm}]}>
        <Text style={styles.statusText}>{'warm'}</Text>
      </View> */}

      {[
        {label: 'Sr.No', value: (index + 1).toString()},
        {label: 'Firm Name', value: data.firm_name != null ? decryptConditionally(data.firm_name) : 'N/A'},
        {label: 'Sector', value: data.sector != null ? data.sector : 'N/A'},
        {label: 'City', value: data.city != null ? decryptConditionally(data.city) : 'N/A'},
        {label: 'Initiator', value: data.file_by || 'N/A'},
        {label: 'Source(D/H/C/O)', value: data.source_of_lead != null ? data.source_of_lead : 'N/A'},
        {label: 'Monthly Turnover', value: data.monthly_turnover != null ? `${(data.monthly_turnover / 100000).toFixed(2)} Lacs` : 'N/A'},
        {label: 'Sanction Required', value: data.estimated_funding_required != null ? `${(data.estimated_funding_required / 100000).toFixed(2)} Lacs` : 'N/A'},
        {label: 'Current Status', value: data.leadProgress && data.leadProgress.length > 0 ? 
          data.leadProgress.reduce((latest, current) => current.id > latest.id ? current : latest).lead_progress_status 
          : 'N/A'},
        {label: 'Process Start', value: data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : 'N/A'},
        {label: 'Created At', value: data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'},
      ].map((item, index) => (
        <Text style={styles.text} key={index}>
          <Text style={styles.label}>{item.label}: </Text>
          {item.value}
        </Text>
      ))}
      {/* Removed Read More button as per request */}
      {/* <TouchableOpacity
        style={styles.readMoreButton}
        onPress={() => onPressReadMore(data.id.toString(), data)}>
        <Text style={styles.readMoreText}>Read more</Text>
      </TouchableOpacity> */}
    </TouchableOpacity>
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
  readMoreButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  readMoreText: {
    color: Colors.tertiaryBlue,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});
