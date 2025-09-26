import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';
import Colors from '@constants/Colors';
import {decryptLocation} from '@utils/crypto';

interface RemarkCardProps {
  item: {
    id: string | number;
    completed_at?: string;
    firm_name?: string;
    task_type?: string;
    task_description?: string;
    remark?: string;
    task_status?: string;
  };
}

const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return {backgroundColor: '#4CAF50', color: '#fff'};
    case 'pending':
      return {backgroundColor: '#8D6E63', color: '#fff'};
    case 'cancelled':
      return {backgroundColor: '#f44336', color: '#fff'};
    default:
      return {backgroundColor: '#666', color: '#fff'};
  }
};

// Helper to format date as dd-mm-yyyy
const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper to safely decrypt values that might be encrypted
const safeDecrypt = (value: string | undefined): string => {
  if (!value) return '-';
  
  try {
    const decrypted = decryptLocation(value);
    return decrypted !== value ? decrypted : value;
  } catch (error) {
    return value;
  }
};

export const RemarkCard: React.FC<RemarkCardProps> = ({item}) => {
  return (
    <View style={styles.remarkCard}>
      <Text style={styles.remarkLabel}>
        <Text style={styles.remarkTitle}>Completed On:</Text>{' '}
        {item.completed_at ? formatDate(item.completed_at) : 'Not completed'}
      </Text>
      <Text style={styles.remarkLabel}>
        <Text style={styles.remarkTitle}>Firm Name:</Text>{' '}
        {safeDecrypt(item.firm_name)}
      </Text>
      <Text style={styles.remarkLabel}>
        <Text style={styles.remarkTitle}>Task Type:</Text> {item.task_type}
      </Text>
      <Text style={styles.remarkLabel}>
        <Text style={styles.remarkTitle}>Task Description:</Text>{' '}
        {item.task_description}
      </Text>
      <Text style={styles.remarkLabel}>
        <Text style={styles.remarkTitle}>Remark:</Text> {item.remark || '-'}
      </Text>
      <Text style={styles.remarkLabel}>
        <Text style={styles.remarkTitle}>Status:</Text>
        <Text style={[styles.statusBadge, getStatusBadgeStyle(item.task_status || '')]}>
          {item.task_status
            ? item.task_status.charAt(0).toUpperCase() +
              item.task_status.slice(1).toLowerCase()
            : '-'}
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  remarkCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  remarkLabel: {
    marginVertical: 2,
    color: '#555',
    fontSize: 14,
  },
  remarkTitle: {
    fontWeight: fontWeight.Bold,
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(6),
    fontSize: scaleFont(12),
    fontWeight: fontWeight.Medium,
    marginLeft: scaleWidth(4),
  },
});
