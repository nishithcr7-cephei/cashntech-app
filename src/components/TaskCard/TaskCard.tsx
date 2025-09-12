import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TaskRecordItem } from '@store/mng';
import { decryptLocation } from '@utils/crypto';
import Colors from '@constants/Colors';
import { scaleFont } from '@utils/Scale';

interface TaskCardProps {
  item: TaskRecordItem;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ item, index }) => {
  const getDisplayTask = (tasks: any[] = []) => {
    if (!Array.isArray(tasks) || tasks.length === 0) return null;
    return tasks[0];
  };

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB') : 'N/A');

  const capitalizeFirst = (str?: string) => {
    const s = (str || '').toString().trim();
    if (!s) return 'N/A';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const task = getDisplayTask(item.task || []);
  const firmName = capitalizeFirst(decryptLocation(item.firm_name || ''));
  const salesman = capitalizeFirst(
    item.user ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() : '',
  );
  const sector = capitalizeFirst(item.sector || '');
  const taskType = capitalizeFirst(task?.task_type);
  const taskDesc = capitalizeFirst(task?.task_description);
  const remark = task?.remark && String(task.remark).trim() ? capitalizeFirst(task.remark) : 'NA';
  const status = capitalizeFirst(task?.task_status);
  const isCompleted = (task?.task_status || '').toString().trim().toLowerCase() === 'completed';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        <Text style={styles.bold}>S.no :</Text> <Text style={styles.value}>{index + 1}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Firm Name :</Text> <Text style={styles.value}>{firmName}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Completed At :</Text> <Text style={styles.value}>{formatDate(task?.completed_at)}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Salesman :</Text> <Text style={styles.value}>{salesman}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Sector :</Text> <Text style={styles.value}>{sector}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Task Type :</Text> <Text style={styles.value}>{taskType}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Task Description :</Text> <Text style={styles.value}>{taskDesc}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Remark :</Text> <Text style={styles.value}>{remark}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Status :</Text>{' '}
        <Text style={[styles.value, isCompleted ? styles.statusCompleted : undefined]}>{status}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: { fontSize: 14, color: '#515151', marginBottom: 6 },
  bold: { fontWeight: 'bold' },
  value: { color: '#515151' },
  statusCompleted: { color: Colors.green },
});

export default TaskCard;