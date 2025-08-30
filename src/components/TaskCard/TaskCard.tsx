import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';

interface TaskCardProps {
  tasktype: string;
  taskDescription: string;
  clientId: string;
  clientName: string;
  location?: string;
  referenceDetails: string;
  sourceDHCO: string;
  status: 'Warm' | 'Hot' | 'Cold';
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
  tasktype,
  taskDescription,
  clientId,
  clientName,
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
        {label: 'Client ID', value: clientId},
        {label: 'Client Name', value: clientName},
        {label: 'Task Type', value: tasktype},
        {label: 'Task Description', value: taskDescription},
      ].map((item, index) => (
        <Text style={styles.text} key={index}>
          <Text style={styles.label}>{item.label}: </Text>
          {item.value}
        </Text>
      ))}
      {typeof location !== 'undefined' && (
        <Text style={styles.text}>
          <Text style={styles.label}>Task Status: </Text>
          {location}
        </Text>
      )}
      {[
        {label: 'Remark', value: referenceDetails},
        {label: 'Completed At', value: sourceDHCO},
      ].map((item, index) => (
        <Text style={styles.text} key={index + 100}>
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
