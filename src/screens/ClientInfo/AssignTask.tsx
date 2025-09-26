/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  Container,
  CustomDropdown,
  DateNTimePicker,
  Input,
  RemarkCard,
} from '@components/index';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {RightCheckmark, AssignTask} from '@assets/Icons';
import fontWeight from '@constants/FontWeight';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import axiosInstance, {CustomRequestConfig} from '@services/api/api';
import { API_URL } from '@config/config';
import Toast from 'react-native-toast-message';
import { getStorage } from '@services/localStorage';
import { decryptLocation } from '@utils/crypto';
import { useDispatch, useSelector } from 'react-redux';
import { clientActions, clientSelector } from '@store/client';


const remarkData = [
  {
    id: '1',
    assignedDate: '10-10-2024',
    assigned_by: "Nishith Upadhyay",
    assigned_to: "test salesman",
    client_name: 'Pritesh Trivedi',
    taskType: 'Call',
    taskDescription: 'Discussed Product',
    remark: 'Client showed interest in premium packages.',
    status: 'Completed',
  },
  {
    id: '2',
    assignedDate: '10-10-2024',
    assigned_by: "Nishith Upadhyay",
    assigned_to: "test salesman",
    client_name: 'Pritesh Trivedi',
    taskType: 'Call',
    taskDescription: 'Discussed Product',
    remark: 'Client showed interest in premium packages.',
    status: 'Completed',
  },
  {
    id: '3',
    assignedDate: '10-10-2024',
    assigned_by: "Nishith Upadhyay",
    assigned_to: "test salesman",
    client_name: 'Pritesh Trivedi',
    taskType: 'Call',
    taskDescription: 'Discussed Product',
    remark: 'Client showed interest in premium packages.',
    status: 'Completed',
  },
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return {color: 'green'};
    case 'pending':
      return {color: 'orange'};
    case 'cancelled':
      return {color: 'red'};
    default:
      return {color: '#333'};
  }
};


type ClientInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<ClientNavigatorType>
>;

type Props = {
  route: {
    params: {
      clientId: string;
      client_name?: string;
      firm_name?: string;
      initiator?: string;
    };
  };
};

export const ClientLeadInfoTab = ({ route }: Props) => {
  const { clientId, client_name, firm_name, initiator } = route.params;
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'Task' | 'Report'>('Task');
  const [schedule, setSchedule] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const BASE_URL = API_URL;  // Use the imported API_URL

  const [salesPersonList, setSalesPersonList] = useState<{label: string; value: string}[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
  const [loadingSalesman, setLoadingSalesman] = useState(false);

  // Task form state - converted to array for multiple tasks
  const [tasks, setTasks] = useState<Array<{
    id: string;
    schedule: Date | undefined;
    selectedTaskType: string;
    selectedSalesPerson: string;
    taskDescription: string;
  }>>([{
    id: '1',
    schedule: undefined,
    selectedTaskType: '',
    selectedSalesPerson: '',
    taskDescription: '',
  }]);

  // Update Task State
  const [updateDateTime, setUpdateDateTime] = useState<Date | undefined>();
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateRemark, setUpdateRemark] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<string>('');

  // Remark Report State - using Redux
  const remarkReportData = useSelector(clientSelector.getClientRemarkReport);
  const loadingRemarkReport = useSelector(clientSelector.getClientRemarkReportLoader);

  // Client Details State
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  // Fetch client details
  useEffect(() => {
    setLoadingClientDetails(true);
    axiosInstance
      .get(`/client-info-master/detail-info/${clientId}`, {
        authRequired: true,
      } as CustomRequestConfig)
      .then(res => {
        if (res.data?.data && res.data.data.length > 0) {
          setClientDetails(res.data.data[0]);
        }
      })
      .catch(error => {
        console.log('Error fetching client details:', error);
        setClientDetails(null);
      })
      .finally(() => setLoadingClientDetails(false));
  }, [clientId]);

  useEffect(() => {
    setLoadingSalesman(true);
    // Use axiosInstance with token mechanism
    axiosInstance
      .get('/client-info-master/salesman/list', {
        authRequired: true,
      } as CustomRequestConfig)
      .then(res => {
        const options = res.data?.data?.map((item: any) => ({
          label: `${item.first_name} ${item.last_name}`.trim(),
          value: item.id,
        })) || [];
        setSalesPersonList(options);
      })
      .catch(error => {
        console.log('Error fetching salesman list:', error);
        setSalesPersonList([]);
      })
      .finally(() => setLoadingSalesman(false));
  }, []);

  // Fetch remark report when switching to Report tab using Redux Saga
  useEffect(() => {
    if (activeTab === 'Report') {
      dispatch(clientActions.getClientRemarkReport(clientId));
    }
  }, [activeTab, clientId, dispatch]);

  // Function to get full name from storage
  const getAssignedBy = async () => {
    try {
      const firstName = await getStorage('user_first_name') || '';
      const lastName = await getStorage('user_last_name') || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (!firstName && !lastName) {
        return 'Test user';
      }
      return fullName;
    } catch (error) {
      console.log('Error getting user name:', error);
      return 'Test user';
    }
  };

  // Updated submit handler for multiple tasks
  const handleSubmit = async () => {
    // Validate all tasks
    const invalidTasks = tasks.filter(task => 
      !task.schedule || !task.selectedTaskType || !task.selectedSalesPerson || !task.taskDescription
    );

    if (invalidTasks.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required fields for all tasks',
      });
      return;
    }

    setLoading(true);
    try {
      const assignedBy = await getAssignedBy();
      const firmName = clientDetails?.firm_name ? safeDecrypt(clientDetails.firm_name) : 'Unknown Company';
      
      const url = `/client-info-master/${clientId}/task`;
      
      const payload = tasks.map(task => ({
        task_description: task.taskDescription,
        task_type: task.selectedTaskType,
        assigned_to: salesPersonList.find(p => p.value === task.selectedSalesPerson)?.label || '',
        assigned_at: task.schedule!.toISOString(),
        assigned_by: assignedBy,
        firm_name: firmName,
        client_id: parseInt(clientId),
      }));

      console.log('API Request:', { url, payload });

      const response = await axiosInstance.post(url, payload, {
        authRequired: true,
      } as CustomRequestConfig);

      console.log('API Response:', response.data);

      if (response.data) {
        Toast.show({
          type: response.status === 200 || response.status === 201 ? 'success' : 'error',
          text1: response.data.message,
          position: 'bottom'
        });

        // Reset form on success
        if (response.status === 200 || response.status === 201) {
          setTasks([{
            id: '1',
            schedule: undefined,
            selectedTaskType: '',
            selectedSalesPerson: '',
            taskDescription: '',
          }]);
        }
      }
    } catch (error: any) {
      console.log('API Error:', error.response?.data || error.message);
      
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to assign tasks',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle task update
  const handleUpdate = async () => {
    if (!updateRemark || !updateStatus || !updateDateTime) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required input fields',
      });
      return;
    }

    setUpdateLoading(true);
    try {
      const url = `/client-info-master/${clientId}/task-update`;
      
      const payload = {
        remark: updateRemark,
        task_status: updateStatus,
        completed_at: updateDateTime.toISOString(),
      };

      console.log('Update API Request:', { url, payload });

      const response = await axiosInstance.patch(url, payload, {
        authRequired: true,
      } as CustomRequestConfig);

      console.log('Update API Response:', response.data);

      if (response.data) {
        Toast.show({
          type: response.status === 200 ? 'success' : 'error',
          text1: response.data.message || 'Task updated successfully',
          position: 'bottom'
        });

        // Reset form on success
        if (response.status === 200) {
          setUpdateRemark('');
          setUpdateStatus('');
          setUpdateDateTime(undefined);
        }
      }
    } catch (error: any) {
      console.log('Update API Error:', error.response?.data || error.message);
      
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to update task',
        position: 'bottom'
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Clear form function
  const handleClearForm = () => {
    Alert.alert(
      'Clear Form',
      'Are you sure you want to clear all form fields?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            setTasks([{
              id: '1',
              schedule: undefined,
              selectedTaskType: '',
              selectedSalesPerson: '',
              taskDescription: '',
            }]);
            setUpdateDateTime(undefined);
          },
        },
      ],
    );
  };

  // Helper to safely decrypt values that might be encrypted
  const safeDecrypt = (value: string | undefined): string => {
    if (!value) return '-';
    
    // Try to decrypt first (in case it's encrypted)
    try {
      const decrypted = decryptLocation(value);
      // If decryption returns the same value, it might be plain text
      // If it returns something different, it was encrypted
      return decrypted !== value ? decrypted : value;
    } catch (error) {
      // If decryption fails, return the original value as plain text
      return value;
    }
  };

  // Helper to format numbers with Indian numbering system
  const formatNumber = (value: number | undefined): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-IN').format(value);
  };

  // Helper functions for task management
  const addNewTask = () => {
    const newTask = {
      id: Date.now().toString(),
      schedule: undefined,
      selectedTaskType: '',
      selectedSalesPerson: '',
      taskDescription: '',
    };
    setTasks([...tasks, newTask]);
  };

  const removeTask = (taskId: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const updateTask = (taskId: string, field: string, value: any) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  return (
    <Container>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Details Card */}
        <View style={styles.card}>
          {loadingClientDetails ? (
            <ActivityIndicator size="small" color={Colors.green} style={{marginTop: 20}} />
          ) : clientDetails ? (
            <>
              {/* Client Details */}
              <Text style={styles.label}>Firm Name</Text>
              <Text style={styles.subLabel}>{safeDecrypt(clientDetails.firm_name)}</Text>
              <View style={styles.separator} />

              <Text style={styles.label}>City</Text>
              <Text style={styles.subLabel}>{safeDecrypt(clientDetails.city)}</Text>
              <View style={styles.separator} />

              <Text style={styles.label}>Source</Text>
              <Text style={styles.subLabel}>{clientDetails.source_of_lead || '-'}</Text>
              <View style={styles.separator} />

              <Text style={styles.label}>Existing Funding Sanctioned Amount</Text>
              <Text style={styles.subLabel}>{formatNumber(clientDetails.existing_funding_sanctioned_amount)}</Text>
              <View style={styles.separator} />

              <Text style={styles.label}>Estimated Funding Required</Text>
              <Text style={styles.subLabel}>{formatNumber(clientDetails.estimated_funding_required)}</Text>
              <View style={styles.separator} />

              <Text style={styles.label}>Monthly Turnover</Text>
              <Text style={styles.subLabel}>{formatNumber(clientDetails.monthly_turnover)}</Text>
            </>
          ) : (
            <Text style={styles.subLabel}>No client details found</Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('Task')}
            style={[
              styles.tabButton,
              activeTab === 'Task' && styles.activeTab,
            ]}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'Task' && styles.activeTabText,
              ]}>
              Task Assignment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Report')}
            style={[
              styles.tabButton,
              activeTab === 'Report' && styles.activeTab,
            ]}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'Report' && styles.activeTabText,
              ]}>
              Remark Report
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Task' ? (
          <View style={styles.formCard}>
            <View style={styles.assignTaskHeader}>
              <Text style={styles.label}>Assign Task</Text>
            </View>

            {tasks.map((task, index) => (
              <View key={task.id} style={styles.taskFormContainer}>
                {tasks.length > 1 && (
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskNumber}>Task {index + 1}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeTask(task.id)}>
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <DateNTimePicker
                  label="Assign Date"
                  value={task.schedule}
                  onConfirm={(date) => updateTask(task.id, 'schedule', date)}
                  containerStyle={{marginTop: scaleHeight(6)}}
                />

                <CustomDropdown
                  label="Sales Person Name"
                  data={salesPersonList}
                  value={task.selectedSalesPerson}
                  onChange={(value) => updateTask(task.id, 'selectedSalesPerson', value)}
                  containerStyle={{marginTop: scaleHeight(6)}}
                />

                <CustomDropdown
                  label="Task Type"
                  data={[
                    {label: 'Call', value: 'call'},
                    {label: 'Email', value: 'email'},
                    {label: 'Meeting', value: 'meeting'},
                  ]}
                  value={task.selectedTaskType}
                  onChange={(value) => updateTask(task.id, 'selectedTaskType', value)}
                  containerStyle={{marginTop: scaleHeight(6)}}
                />

                <Input
                  label="Task Description"
                  placeholder="Enter task description (2-3 lines)"
                  containerStyle={{marginTop: scaleHeight(6)}}
                  value={task.taskDescription}
                  onChangeText={(text) => updateTask(task.id, 'taskDescription', text)}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            ))}

            {/* Add More Task Button */}
            <TouchableOpacity style={styles.addMoreButton} onPress={addNewTask}>
              <Text style={styles.addMoreButtonText}>Add more task</Text>
              <Text style={styles.addMoreButtonPlus}>+</Text>
            </TouchableOpacity>

            {/* Button Container */}
            <View style={styles.footerButton}>
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.7}
                onPress={handleClearForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.assignButton}
                activeOpacity={0.7}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.assignButtonText}>Assign task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{marginTop: 20}}>
            <View style={styles.remarkReportHeader}>
              <Text style={[styles.label, {marginBottom: 12}]}>
                Remark Report of {clientDetails?.firm_name ? safeDecrypt(clientDetails.firm_name) : 'Company'}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{remarkReportData.length}</Text>
              </View>
            </View>
            {loadingRemarkReport ? (
              <ActivityIndicator size="small" color={Colors.green} style={{marginTop: 20}} />
            ) : (
              remarkReportData.length === 0 ? (
                <Text style={{color: '#888', textAlign: 'center'}}>No remark report found.</Text>
              ) : (
                remarkReportData.map(item => (
                  <RemarkCard key={item.id} item={item} />
                ))
              )
            )}
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 16},
  scrollContent: {
    paddingBottom: scaleHeight(40), // Reduced from 100 to 40
  },
  header: {
    backgroundColor: '#fdeeee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e53935',
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  badgeContainer: {
    backgroundColor: '#f4c542',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontWeight: fontWeight.Bold,
    fontSize: scaleFont(12),
    color: '#fff',
  },

  label: {
    fontWeight: fontWeight.Bold,
    fontSize: scaleFont(16),
    marginTop: 8,
  },
  assignTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  subLabel: {color: '#555', marginVertical: 2},
  boldText: {fontWeight: 'bold'},
  separator: {height: 1, backgroundColor: '#ddd', marginVertical: 8},

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 10,
  },
  tabButton: {flex: 1, padding: 12, alignItems: 'center'},
  tabText: {color: '#444', fontWeight: '600'},
  activeTab: {borderBottomWidth: 2, borderBottomColor: '#e53935'},
  activeTabText: {color: '#e53935'},

  formCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    paddingBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: scaleHeight(400),
  },
  inputLabel: {fontWeight: 'bold', marginTop: 12, marginBottom: 4},
  inputWithIcon: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  input: {flex: 1, fontSize: 14, color: '#000'},

  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
  },
  addTaskText: {
    marginLeft: 6,
    fontWeight: fontWeight.SemiBold,
    fontSize: scaleFont(13),
    marginRight: scaleHeight(6),
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: scaleHeight(20),
    paddingHorizontal: scaleWidth(10),
    gap: scaleWidth(10),
  },
  cancelButton: {
    backgroundColor: '#e53935',
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(24),
    borderRadius: scaleWidth(6),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scaleWidth(100),
  },
  cancelButtonText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
  },
  assignButton: {
    backgroundColor: '#028D3E',
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(24),
    borderRadius: scaleWidth(6),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scaleWidth(150),
  },
  assignButtonText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
  },
  // New styles for multiple tasks
  taskFormContainer: {
    marginBottom: scaleHeight(20),
    paddingBottom: scaleHeight(15),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  taskNumber: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.Bold,
    color: Colors.primaryColor,
  },
  deleteButton: {
    padding: scaleWidth(5),
    borderRadius: scaleWidth(15),
    backgroundColor: '#ffebee',
    minWidth: scaleWidth(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: scaleFont(16),
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2.5,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    alignSelf: 'flex-start',
    marginTop: scaleHeight(24),
    minWidth: scaleWidth(140),
  },
  addMoreButtonText: {
    fontSize: scaleFont(14),
    color: '#7A7A7A',
    fontWeight: fontWeight.Medium,
  },
  addMoreButtonPlus: {
    fontSize: scaleFont(16),
    color: '#7A7A7A',
    fontWeight: fontWeight.Bold,
    marginLeft: scaleWidth(6),
  },
  remarkReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: '#fce4ec',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    minWidth: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: scaleFont(12),
    fontWeight: fontWeight.SemiBold,
    color: '#666',
  },
});
