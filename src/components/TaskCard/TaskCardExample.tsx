import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import TaskCard from './TaskCard';

// Sample data as provided by the user
const sampleData = {
  "id": 134,
  "firm_name": "7AMgNpGTAEqc7vUFdEqMgw==",
  "sector": "FMCG",
  "created_at": "2025-09-15T06:57:04.607Z", // This will show as "Sep 2025"
  "task": [
    {
      "id": 86,
      "assigned_by": "Kumare Sneha ",
      "assigned_to": "Amardeep Darekar",
      "assigned_at": "2025-09-15T21:35:00.000Z",
      "task_type": "meeting",
      "task_description": "collect documents",
      "task_status": "completed", // This will show in green
      "remark": "Task completed successfully",
      "completed_at": "2025-09-15T22:00:00.000Z"
    }
  ]
};

const TaskCardExample: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <TaskCard item={sampleData} index={0} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
});

export default TaskCardExample;
