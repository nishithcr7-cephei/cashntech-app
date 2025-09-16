import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import TaskCard from './TaskCard';

// Test data with various data types and edge cases
const testDataScenarios = [
  // Normal data (your original sample)
  {
    name: "Normal Data",
    data: {
      "id": 134,
      "firm_name": "7AMgNpGTAEqc7vUFdEqMgw==",
      "sector": "FMCG",
      "created_at": "2025-09-15T06:57:04.607Z",
      "task": [
        {
          "id": 86,
          "assigned_by": "Kumare Sneha ",
          "assigned_to": "Amardeep Darekar",
          "assigned_at": "2025-09-15T21:35:00.000Z",
          "task_type": "meeting",
          "task_description": "collect documents",
          "task_status": "completed",
          "remark": "Task completed successfully",
          "completed_at": "2025-09-15T22:00:00.000Z"
        }
      ]
    }
  },
  
  // Data with null values
  {
    name: "Data with Null Values",
    data: {
      "id": 135,
      "firm_name": null,
      "sector": null,
      "created_at": null,
      "task": [
        {
          "id": 87,
          "assigned_by": null,
          "assigned_to": null,
          "assigned_at": null,
          "task_type": null,
          "task_description": null,
          "task_status": null,
          "remark": null,
          "completed_at": null
        }
      ]
    }
  },
  
  // Data with different data types
  {
    name: "Mixed Data Types",
    data: {
      "id": "136", // string instead of number
      "firm_name": 12345, // number instead of string
      "sector": 999, // number instead of string
      "created_at": 1640995200000, // timestamp number
      "task": [
        {
          "id": "88", // string ID
          "assigned_by": 123, // number instead of string
          "assigned_to": 456, // number instead of string
          "assigned_at": 1640995200000, // timestamp number
          "task_type": 789, // number instead of string
          "task_description": 101112, // number instead of string
          "task_status": 1, // number instead of string
          "remark": 131415, // number instead of string
          "completed_at": 1640995200000 // timestamp number
        }
      ]
    }
  },
  
  // Empty task array
  {
    name: "Empty Task Array",
    data: {
      "id": 137,
      "firm_name": "Test Firm",
      "sector": "Technology",
      "created_at": "2025-09-15T06:57:04.607Z",
      "task": []
    }
  },
  
  // Missing task property
  {
    name: "Missing Task Property",
    data: {
      "id": 138,
      "firm_name": "Test Firm 2",
      "sector": "Finance",
      "created_at": "2025-09-15T06:57:04.607Z"
      // task property is missing
    }
  },
  
  // Completely empty object
  {
    name: "Empty Object",
    data: {}
  }
];

const TaskCardDataTypesTest: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>TaskCard Data Type Handling Test</Text>
      
      {testDataScenarios.map((scenario, index) => (
        <View key={index} style={styles.scenarioContainer}>
          <Text style={styles.scenarioTitle}>{scenario.name}</Text>
          <TaskCard item={scenario.data} index={index} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  scenarioContainer: {
    marginBottom: 20,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
  },
});

export default TaskCardDataTypesTest;
