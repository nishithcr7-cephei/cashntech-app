import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Container, AppBar} from '@components/index';
import TaskCard from '@components/TaskCard/TaskCard';
import {LeftChevronCircle} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleWidth, scaleHeight} from '@utils/Scale';
import { TaskRecordItem } from '@store/mng';
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
  remark: string | null | undefined;
  completed_at: string | null | undefined;
  client: number;
}

export const SubTask = () => {
  const navigation = useNavigation<DocNavigationType>();
  const route = useRoute();
  const {clientId, clientName, taskData} = route.params as SubTaskRouteParams;

  // Optimal: Direct data processing from passed parameters
  const subTasks = useMemo(() => {
    if (!taskData || !taskData.task || taskData.task.length <= 1) return [];
    
    // Simply slice to get sub-tasks (exclude first task)
    // Data is already sorted by the parent component
    return taskData.task.slice(1);
  }, [taskData]);

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
      firm_name: taskData?.firm_name || '',
      sector: taskData?.sector || '',
      created_at: taskData?.created_at || '',
      task: [{
        ...item,
        remark: item.remark === null ? undefined : item.remark,
        completed_at: item.completed_at === null ? undefined : item.completed_at,
      }] // Single task in array format
    };
    
    return (
      <TouchableOpacity
        onPress={() => {
          // Only navigate if status is Pending
          if (isTaskPending) {
            (navigation as any).navigate('DocNavigator', {
              screen: 'TaskUpdate',
              params: {
                taskId: String(item.id), // SubTask ID
                subTaskId: String(item.id), // Alias for subTaskId
                task_status: item.task_status,
                remark: item.remark && item.remark !== 'NA' ? item.remark : '',
                completed_at: item.completed_at,
                task_description: item.task_description,
                client_name: clientName,
                task_type: item.task_type,
                assigned_to: item.assigned_to,
                navigationSource: 'SubTask', // Indicator for navigation source
                clientId: clientId, // Pass clientId for back navigation
                mainTaskId: String(taskData?.id), // Main task ID for reference
              }
            });
          }
        }}
        disabled={!isTaskPending}>
        <TaskCard item={taskRecordItem} index={index} hasSubTasks={false} hideId={false} displayId={item.id} />
      </TouchableOpacity>
    );
  };

  return (
    <Container>
      <AppBar title="Sub Task" navigation={navigation as any} hideHamburger={true} />
      
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={() => {
            // Navigate back to ManageTask without resetting
            (navigation as any).getParent()?.navigate('ManageTask');
          }}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>{clientName}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.clientName}>{clientName}</Text>
        <Text style={styles.subTaskCount}>
          {subTasks.length} Sub Task{subTasks.length !== 1 ? 's' : ''}
        </Text>
      </View>

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
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LimeGray,
    paddingLeft: 16,
    paddingVertical: 12,
  },
  subheader: {
    marginLeft: 12,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
  },
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
