import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';

interface TaskCardProps {
  srNo?: number;
  firmName?: string;
  sector?: string;
  assignedBy?: string;
  assignedTo?: string;
  taskDescription: string;
  taskStatus?: string;
  remarks?: string;
  createdAt?: string;
  completedAt?: string;
  // Keep old props for compatibility
  tasktype?: string;
  clientId?: string;
  clientName?: string;
  salesman?: string;
  location?: string;
  referenceDetails?: string;
  sourceDHCO?: string;
  status?: 'Warm' | 'Hot' | 'Cold';
  historyStatus?: 'Completed' | 'Pending';
  showHistoryStatus?: boolean;
  historyStatusLabel?: string;
  showReadMore?: boolean;
}

const ChipColors = {
  Warm: '#FFC107',
  Hot: '#FF5656',
  Cold: Colors.tertiaryBlue,
};

export const TaskCard: React.FC<TaskCardProps> = ({
  srNo,
  firmName,
  sector,
  assignedBy,
  assignedTo,
  taskDescription,
  taskStatus,
  remarks,
  createdAt,
  completedAt,
  // Old props for compatibility
  tasktype,
  clientId,
  clientName,
  salesman,
  location,
  referenceDetails,
  sourceDHCO,
  status,
  historyStatus,
  showHistoryStatus,
  historyStatusLabel,
  showReadMore = true,
}) => {
  return (
    <View style={styles.card}>
      {/* <View style={[styles.statusBadge, {backgroundColor: ChipColors[status]}]}>
        <Text style={styles.statusText}>{status}</Text>
      </View> */}

      {[
        ...(srNo ? [{label: 'S.No', value: srNo.toString()}] : []),
        ...(firmName ? [{label: 'Firm Name', value: firmName}] : []),
        ...(sector ? [{label: 'Sector', value: sector}] : []),
        ...(assignedBy ? [{label: 'Assigned By', value: assignedBy}] : []),
        ...(assignedTo ? [{label: 'Assigned To', value: assignedTo}] : []),
        ...(taskDescription ? [{label: 'Description', value: taskDescription}] : []),
      ].map((item, index) => (
        <Text style={styles.text} key={index}>
          <Text style={styles.label}>{item.label}: </Text>
          {item.value}
        </Text>
      ))}
      
      {/* Status with conditional color */}
      {taskStatus && (
        <Text style={styles.text}>
          <Text style={styles.label}>Status: </Text>
          <Text style={[
            styles.statusValue,
            {color: taskStatus.toLowerCase() === 'completed' ? '#28a745' : '#6c757d'}
          ]}>
            {taskStatus}
          </Text>
        </Text>
      )}
      
      {[
        ...(remarks ? [{label: 'Remarks', value: remarks}] : []),
        ...(createdAt ? [{label: 'Created At', value: createdAt}] : []),
        ...(completedAt ? [{label: 'Completed At', value: completedAt}] : []),
      ].map((item, index) => (
        <Text style={styles.text} key={index + 200}>
          <Text style={styles.label}>{item.label}: </Text>
          {item.value}
        </Text>
      ))}
      {showHistoryStatus && historyStatus && (
        <Text style={styles.text}>
          <Text style={styles.label}>{historyStatusLabel ?? 'Status'}: </Text>
          {historyStatus}
        </Text>
      )}
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
  text: {
    color: '#555',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  statusValue: {
    fontWeight: 'bold',
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
