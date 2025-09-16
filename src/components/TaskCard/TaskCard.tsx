import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { decryptLocation } from '@utils/crypto';
import Colors from '@constants/Colors';
import { scaleFont } from '@utils/Scale';
import { 
  getDisplayTask, 
  formatDate, 
  formatMonthYear,
  capitalizeFirst, 
  isTaskCompleted, 
  formatTaskDescription, 
  formatTaskRemark, 
  formatTaskStatus 
} from '@utils/taskUtils';

interface TaskData {
  id?: number | string;
  firm_name?: string | number | null;
  sector?: string | number | null;
  created_at?: string | number | Date | null;
  task?: Array<{
    id?: number | string;
    assigned_by?: string | number | null;
    assigned_to?: string | number | null;
    assigned_at?: string | number | Date | null;
    task_type?: string | number | null;
    task_description?: string | number | null;
    task_status?: string | number | null;
    remark?: string | number | null;
    completed_at?: string | number | Date | null;
  }>;
}

interface TaskCardProps {
  item: TaskData;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ item, index }) => {
  // Safe data extraction with fallbacks
  const task = getDisplayTask(item?.task || []);
  const firmName = capitalizeFirst(decryptLocation(String(item?.firm_name || '')));
  const sector = capitalizeFirst(item?.sector);
  const assignedBy = capitalizeFirst(task?.assigned_by);
  const assignedTo = capitalizeFirst(task?.assigned_to);
  const assignedAt = formatDate(task?.assigned_at);
  const taskType = capitalizeFirst(task?.task_type);
  const taskDescription = formatTaskDescription(task?.task_description);
  const taskStatus = formatTaskStatus(task?.task_status);
  const remark = formatTaskRemark(task?.remark);
  const createdAt = formatMonthYear(item?.created_at);
  const completedAt = formatDate(task?.completed_at);
  const isCompleted = isTaskCompleted(task?.task_status);
  
  // Safe index handling
  const serialNumber = typeof index === 'number' && index >= 0 ? index + 1 : 1;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        <Text style={styles.bold}>SrNo :</Text> <Text style={styles.value}>{serialNumber}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>FirmName :</Text> <Text style={styles.value}>{firmName}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Sector :</Text> <Text style={styles.value}>{sector}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Assigned By :</Text> <Text style={styles.value}>{assignedBy}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Assigned to :</Text> <Text style={styles.value}>{assignedTo}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Assigned At :</Text> <Text style={styles.value}>{assignedAt}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Type :</Text> <Text style={styles.value}>{taskType}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Description :</Text> <Text style={styles.value}>{taskDescription}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Status :</Text>
        <Text style={[styles.value, isCompleted && styles.statusCompleted]}>
          {taskStatus}
        </Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Remark :</Text> <Text style={styles.value}>{remark}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Created At :</Text> <Text style={styles.value}>{createdAt}</Text>
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>CompletedAt :</Text> <Text style={styles.value}>{completedAt}</Text>
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
    elevation: 2,
  },
  label: { 
    fontSize: 14, 
    color: '#515151', 
    marginBottom: 6,
    lineHeight: 20,
  },
  bold: { 
    fontWeight: 'bold',
    color: '#333333',
  },
  value: { 
    color: '#515151',
    flex: 1,
  },
  statusCompleted: { 
    color: Colors.green,
    fontWeight: '600',
  },
});

export default TaskCard;