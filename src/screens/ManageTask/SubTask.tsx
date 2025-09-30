import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Container, AppBar} from '@components/index';
import TaskCard from '@components/TaskCard/TaskCard';
import {LeftChevron} from '@assets/Icons';
import Colors from '@constants/Colors';
import {scaleFont} from '@utils/Scale';
import {decryptLocation} from '@utils/crypto';
import * as mngActions from '@store/mng';
import { mngSelector, TaskRecordItem } from '@store/mng';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

interface SubTaskRouteParams {
  clientId: string;
  clientName: string;
  taskData: TaskRecordItem;
}

interface SubTaskItem {
  id: number;
  assigned_by: string;
  assigned_to: string;
  firm_name: string;
  assigned_at: string;
  task_type: string;
  task_description: string;
  task_status: string;
  remark: string | null;
  completed_at: string | null;
  client: number;
}

export const SubTask = () => {
  const navigation = useNavigation<DocNavigationType>();
  const route = useRoute();
  const dispatch = useDispatch();
  const {clientId, clientName, taskData} = route.params as SubTaskRouteParams;

  // Redux selectors
  const taskRecordsLoading = useSelector(mngSelector.getTaskRecordsLoading);
  const taskRecordsList = useSelector(mngSelector.getTaskRecordsList);

  // Get the specific client's task data
  const clientTaskData = useMemo(() => {
    if (!taskData || !taskData.task) return null;
    
    // Sort tasks by assigned_at date (newest first) and exclude the first one (which is shown in main list)
    const sortedTasks = [...taskData.task]
      .sort((a, b) => {
        const dateA = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
        const dateB = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(1); // Remove the first task (latest one shown in main list)
    
    return {
      ...taskData,
      task: sortedTasks
    };
  }, [taskData]);

  const fetchReports = () => {
    dispatch(mngActions.getTaskRecordsList({hasTask: true}));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // Navigate back to ManageTask when Android back button is pressed
      (navigation as any).getParent()?.navigate('ManageTask');
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  const renderSubTaskItem = ({item, index}: {item: SubTaskItem; index: number}) => {
    const isTaskPending = item.task_status?.toLowerCase() === 'pending';
    
    // Create a TaskRecordItem format for the TaskCard component
    const taskRecordItem: TaskRecordItem = {
      id: item.client,
      firm_name: clientTaskData?.firm_name || '',
      sector: clientTaskData?.sector || '',
      created_at: clientTaskData?.created_at || '',
      task: [item] // Single task in array format
    };
    
    return (
      <TouchableOpacity
        onPress={() => {
          // Only navigate if status is Pending
          if (isTaskPending) {
            (navigation as any).navigate('DocNavigator', {
              screen: 'TaskUpdate',
              params: {
                taskId: String(item.id),
                task_status: item.task_status,
                remark: item.remark && item.remark !== 'NA' ? item.remark : '',
                completed_at: item.completed_at,
                task_description: item.task_description,
                client_name: clientName,
                task_type: item.task_type,
                assigned_to: item.assigned_to,
              }
            });
          }
        }}
        disabled={!isTaskPending}>
        <TaskCard item={taskRecordItem} index={index} hasSubTasks={false} />
      </TouchableOpacity>
    );
  };

  const subTasks = clientTaskData?.task || [];

  return (
    <Container>
      <AppBar 
        title="Sub Task" 
        navigation={navigation as any}
        renderLeftIcon={<LeftChevron height={20} width={20} />}
        onPressLeftIcon={() => {
          // Navigate back to ManageTask without resetting
          (navigation as any).getParent()?.navigate('ManageTask');
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.clientName}>{clientName}</Text>
        <Text style={styles.subTaskCount}>
          {subTasks.length} Sub Task{subTasks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {taskRecordsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={subTasks as SubTaskItem[]}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderSubTaskItem}
          contentContainerStyle={{padding: 16}}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Sub Tasks Found</Text>
              <Text style={styles.emptySubText}>
                This client doesn't have any additional tasks beyond the main task.
              </Text>
            </View>
          }
          onRefresh={fetchReports}
          refreshing={taskRecordsLoading}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  clientName: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  subTaskCount: {
    fontSize: scaleFont(14),
    color: Colors.SteelGray,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 50 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: { 
    textAlign: 'center', 
    color: Colors.SteelGray, 
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    color: Colors.SteelGray,
    fontSize: scaleFont(14),
    opacity: 0.7,
  },
});

export default SubTask;
