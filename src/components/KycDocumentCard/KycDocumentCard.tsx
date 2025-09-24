import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import Colors from '@constants/Colors';
import {IKycDetailsResponseDatum} from '@store/kyc';
import {decryptUtility} from '@utils/crypto';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';

interface KycDocumentCardProps {
  data: IKycDetailsResponseDatum;
  index: number;
  onPress: () => void;
}

const getIntentStyle = (intent: string | null) => {
  if (intent === 'High') {
    return {
      backgroundColor: '#4CAF50', // Green
      color: '#FFFFFF'
    };
  } else if (intent === 'Medium') {
    return {
      backgroundColor: '#8D6E63', // Brown
      color: '#FFFFFF'
    };
  }
  return {
    backgroundColor: '#E0E0E0', // Default gray
    color: '#000000'
  };
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
};

export const KycDocumentCard: React.FC<KycDocumentCardProps> = ({
  data,
  index,
  onPress,
}) => {
  const intentStyle = getIntentStyle(data.intent);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Card Content */}
      <View style={styles.cardContent}>
        {[
          {label: 'Sr.No', value: (index + 1).toString()},
          {label: 'Firm Name', value: decryptUtility(data.firm_name || '')},
          {label: 'Sector', value: data.sector || 'N/A'},
          {label: 'City', value: decryptUtility(data.city || '')},
          {label: 'Initiator', value: data.file_by || 'N/A'},
          {label: 'Source (D/H/C/O)', value: data.source_of_lead || 'N/A'},
          {label: 'Current Status', value: data.status || 'N/A', isStatus: true},
          {label: 'Existing Funding Amount', value: '5000000'}, // Placeholder - not in current data
          {label: 'Estimated Funding Required', value: '10000000'}, // Placeholder - not in current data
          {label: 'Monthly Turnover', value: data.monthly_turnover ? data.monthly_turnover.toLocaleString() : 'N/A'},
          {label: 'Created At', value: formatDate(data.created_at)},
        ].map((item, itemIndex) => (
          <View key={itemIndex} style={styles.dataRow}>
            <Text style={styles.label}>{item.label}:</Text>
            <Text style={[
              styles.value,
              item.isStatus && {color: item.value === 'Completed' ? '#4CAF50' : '#666666'}
            ]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FA',
    marginVertical: scaleHeight(8),
    marginHorizontal: scaleWidth(10),
    borderRadius: scaleWidth(8),
    borderColor: '#E5E7EB',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(16),
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(6),
    paddingVertical: scaleHeight(2),
  },
  label: {
    fontSize: scaleFont(13),
    fontWeight: FontWeight.Medium,
    color: '#374151',
    flex: 1,
  },
  value: {
    fontSize: scaleFont(13),
    fontWeight: FontWeight.Regular,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  intentBadge: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    minWidth: scaleWidth(60),
    alignItems: 'center',
  },
  intentText: {
    fontSize: scaleFont(12),
    fontWeight: FontWeight.SemiBold,
    textAlign: 'center',
  },
});
