import {Search, LeftChevronCircle} from '@assets/Icons';
import {AppBar, Container} from '@components/index';
import {TaskCard} from '@components/TaskCard/TaskCard';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import FontWeight from '@constants/FontWeight';
import fontWeight from '@constants/FontWeight';
import {TextInput} from 'react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {tasklogActions, tasklogSelector} from '@store/tasklog';
import {ITaskRecord, ITaskItem, ITaskDisplayItem} from '@store/tasklog/tasklog.types';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import clientApi from '@services/api/client.api';
import {decryptConditionally} from '@utils/crypto';

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

export const TaskLogTabs = () => {
  const [activeTab, setActiveTab] = useState<'tasks'>('tasks');
  const navigation = useNavigation<DocNavigationType>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<Date | undefined>();
  const dispatch = useDispatch();
  const TaskHitoryData = useSelector(tasklogSelector.getTaskHistory);
  const reportData = useSelector(tasklogSelector.getRemarkReport);
  const callgetTaskhistory = () => {
   
    
  };
  useEffect(() => {
    callgetTaskhistory();
  }, []);

  const fetchTaskRecords = async () => {
    setIsLoading(true);
    try {
      const body = {hasTask: true};
      const res = await clientApi.getTaskRecords(body);
      
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      
      setTaskRecords(list);
    } catch (e) {
      setTaskRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchTaskRecords();
  }, []);

  // Also refetch whenever the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      fetchTaskRecords();
    }, []),
  );

  const [salesmanList, setSalesmanList] = useState<
    {label: string; value: string}[]
  >([]);
  const [selectedSalesman, setSelectedSalesman] = useState('');
  useEffect(() => {
    clientApi.getSalesmanList().then(res => {
      if (res?.data) {
        setSalesmanList(
          res.data.map((s: any) => ({
            label: `${s.first_name} ${s.last_name}`.trim(),
            value: s.id.toString(),
          })),
        );
      }
    });
  }, []);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mapStatus = (apiStatus: string): 'Warm' | 'Hot' | 'Cold' => {
    switch (apiStatus?.toLowerCase()) {
      case 'pending':
        return 'Warm';
      case 'completed':
        
        return 'Hot';
      case 'cancelled':
        return 'Cold';
      default:
        return 'Warm';
    }
  };

  const formatToDMY = (iso?: string) => {
    if (!iso) return 'NA';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'NA';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const formatToMonthYear = (iso?: string) => {
    if (!iso) return 'NA';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'NA';
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${month} ${year}`;
  };

  const capitalizeFirst = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const [taskRecords, setTaskRecords] = useState<ITaskRecord[]>([]);

  // Log when state updates to verify shape
  useEffect(() => {
    // State logging removed
  }, [taskRecords]);

  // Normalize in case we ever receive an object with a nested data property
  const normalizedRecords: ITaskRecord[] = Array.isArray(taskRecords)
    ? taskRecords
    : Array.isArray((taskRecords as any)?.data)
    ? (taskRecords as any).data
    : [];

  const taskList: ITaskDisplayItem[] = normalizedRecords.flatMap((report: ITaskRecord) =>
    (report.task || []).map((task: ITaskItem) => ({
      id: task.id,
      firmName: capitalizeFirst(decryptConditionally(report.firm_name || '')),
      sector: capitalizeFirst(report.sector || ''),
      assignedBy: capitalizeFirst(task.assigned_by || ''),
      assignedTo: capitalizeFirst(task.assigned_to || ''),
      taskDescription: capitalizeFirst(task.task_description || ''),
      taskStatus: capitalizeFirst(task.task_status || ''),
      remarks: task.remark ? capitalizeFirst(task.remark) : 'N/A',
      createdAt: formatToMonthYear(task.assigned_at),
      completedAt: formatToDMY(task.completed_at || undefined),
      // Keep old fields for compatibility
      tasktype: capitalizeFirst(task.task_type || ''),
      clientId: String(report.id ?? ''),
      clientName: capitalizeFirst(decryptConditionally(report.firm_name || '')),
      salesman: capitalizeFirst(task.assigned_to || ''),
      location: capitalizeFirst(task.task_status || ''),
      referenceDetails: task.remark ? capitalizeFirst(task.remark) : 'N/A',
      sourceDHCO: formatToDMY(task.completed_at || undefined),
      status: mapStatus(task.task_status),
      raw: task,
      srNo: 0, // Will be set in the next map
    })),
  ).map((item, globalIndex: number) => ({
    ...item,
    srNo: globalIndex + 1,
  }));

  // Filter tasks based on search query
  const filteredTaskList = taskList.filter((item: ITaskDisplayItem) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    return (
      // Search by firm name
      item.clientName.toLowerCase().includes(query) ||
      // Search by client ID
      item.clientId.toLowerCase().includes(query) ||
      // Search by task type
      item.tasktype.toLowerCase().includes(query) ||
      // Search by task status
      item.location.toLowerCase().includes(query) ||
      // Search by serial number
      item.srNo.toString().includes(query)
    );
  });

  useEffect(() => {}, [selectedTask]);

  const handleUpdateSubmit = async () => {};

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <View>
            <View style={styles.RowContainer}>
              <View style={styles.Subrowcontainer}>
                <Text style={styles.Subrowcontainertxt}>Task</Text>
                <View style={styles.Badge}>
                  <Text style={styles.Badgetext}>{filteredTaskList.length}</Text>
                </View>
              </View>
              <View style={styles.Searchbox}>
                <Search height={12} width={12} />
                <TextInput
                  style={styles.input}
                  placeholder="Search by Firm name"
                  placeholderTextColor={Colors.balancedGray}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
                          <FlatList
              data={filteredTaskList}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => {
                    // Only navigate if status is Pending
                    if (item.raw?.task_status?.toLowerCase() === 'pending') {
                      (navigation as any).navigate('TaskUpdate', {
                        taskId: String(item.id),
                        task_status: item.raw?.task_status,
                        remark:
                          item.referenceDetails && item.referenceDetails !== 'NA'
                            ? item.referenceDetails
                            : '',
                        completed_at: item.raw?.completed_at,
                        task_description: item.taskDescription,
                        client_name: item.clientName,
                        task_type: item.raw?.task_type,
                        assigned_to: item.raw?.assigned_to,
                      });
                    }
                    // If status is Completed, do nothing (no navigation)
                  }}
                  disabled={item.raw?.task_status?.toLowerCase() === 'completed'}>
                  <TaskCard
                    srNo={item.srNo}
                    firmName={item.firmName}
                    sector={item.sector}
                    assignedBy={item.assignedBy}
                    assignedTo={item.assignedTo}
                    taskDescription={item.taskDescription}
                    taskStatus={item.taskStatus}
                    remarks={item.remarks}
                    createdAt={item.createdAt}
                    completedAt={item.completedAt}
                    // Keep old props for compatibility
                    salesman={item.salesman}
                    tasktype={item.tasktype}
                    clientId={item.clientId}
                    clientName={item.clientName}
                    location={item.location}
                    referenceDetails={item.referenceDetails}
                    sourceDHCO={item.sourceDHCO}
                    status={item.status}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={{paddingBottom: 20}}
              ListEmptyComponent={
                <Text style={styles.emptyList}>
                  {searchQuery.trim() ? 'No matching tasks found' : 'No Task Found'}
                </Text>
              }
              refreshing={false}
              onRefresh={fetchTaskRecords}
            />
          </View>
        );
      default:
        return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text>Loading...</Text>
          </View>
        );
    }
  };

  console.log('TaskLogTabs: Component rendering...');

  return (
    <Container>
      <AppBar title="Task Log" navigation={navigation} />
      <View>
        <View style={styles.subContainer}>
          <Text style={styles.subheader}>Task List</Text>
        </View>
      </View>
      <View style={styles.container}>
        {/* Tabs */}
        <View />

        {/* Content */}
        <View style={styles.content}>{renderTabContent()}</View>
      </View>
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
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyList: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.SteelGray,
    textAlign: 'center',
  },
  Subcontainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  RowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  Subrowcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  Subrowcontainertxt: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.darkblack,
  },
  Badge: {
    backgroundColor: Colors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  Badgetext: {
    color: Colors.SteelGray,
  },
  Cardlist: {
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 16,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: Colors.primaryColor,
    fontWeight: fontWeight.SemiBold,
  },
  activeIndicator: {
    height: 3,
    width: '100%',
    backgroundColor: Colors.primaryColor,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginBottom: 24,
    color: Colors.graybase,
  },
  subHeading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 18,
    color: '#888',
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  clearButton: {},
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    gap: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.green,
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  Searchbox: {
    flex: 1.5,
    flexDirection: 'row',
    height: scaleHeight(40),
    marginLeft: 5,
    marginTop: 2,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderWidth: 1,
    borderRadius: 3,
    gap: 16,
    paddingHorizontal: 10,
  },
  input: {
    fontSize: scaleFont(12),
  },
  Filterbox: {
    width: scaleWidth(32),
    height: scaleHeight(30),
    backgroundColor: Colors.primaryColor,
    marginLeft: scaleWidth(8),
    padding: 10,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
