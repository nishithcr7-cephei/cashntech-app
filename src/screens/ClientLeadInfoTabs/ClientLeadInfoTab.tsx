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
} from '@components/index';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {RightCheckmark} from '@assets/Icons';
import fontWeight from '@constants/FontWeight';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import axiosInstance from '@services/api/api';
import { API_URL } from '@config/config';
import Toast from 'react-native-toast-message';
import { getStorage } from '@services/localStorage';
import { decryptLocation } from '@utils/crypto';
import { useDispatch } from 'react-redux';
import { clientActions } from '@store/client';


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

  const [selectedTaskType, setSelectedTaskType] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [remark, setRemark] = useState<string>('');

  // Update Task State
  const [updateDateTime, setUpdateDateTime] = useState<Date | undefined>();
  const [updateLoading, setUpdateLoading] = useState(false);

  // Remark Report State
  const [remarkReportData, setRemarkReportData] = useState<any[]>([]);
  const [loadingRemarkReport, setLoadingRemarkReport] = useState(false);

  useEffect(() => {
    setLoadingSalesman(true);
    // Use axiosInstance with token mechanism
    axiosInstance
      .get('/client-info-master/salesman/list')
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

  // Fetch remark report when switching to Report tab
  useEffect(() => {
    if (activeTab === 'Report') {
      setLoadingRemarkReport(true);
      // Use axiosInstance with token mechanism
      axiosInstance
        .get(`/client-info-master/${clientId}/remark-report`)
        .then(res => {
          setRemarkReportData(res.data?.data || []);
        })
        .catch(error => {
          console.log('Error fetching remark report:', error);
          setRemarkReportData([]);
        })
        .finally(() => setLoadingRemarkReport(false));
    }
  }, [activeTab, clientId]);

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

  // Updated submit handler
  const handleSubmit = async () => {
    if (!schedule || !selectedTaskType || !selectedSalesPerson || !taskDescription || !selectedStatus || !remark) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required input fields',
      });
      return;
    }

    setLoading(true);
    try {
      const assignedBy = await getAssignedBy();
      
      const url = `/client-info-master/${clientId}/task`;
      
      const payload = [{
        assigned_at: schedule.toISOString(),
        task_type: selectedTaskType,
        assigned_to: salesPersonList.find(p => p.value === selectedSalesPerson)?.label || '',
        task_description: taskDescription,
        assigned_by: assignedBy, // This will be "firstName lastName"
        task_status: selectedStatus, // Add task_status to the payload
        remark: remark, // Add remark to the payload
      }];

      console.log('API Request:', { url, payload });
      
     

      const response = await axiosInstance.post(url, payload);

      console.log('API Response:', response.data);
      

      if (response.data) {
        // Always show the message from response if available
        Toast.show({
          type: response.status === 200 || response.status === 201 ? 'success' : 'error',
          text1: response.data.message,
          position: 'bottom'
        });

        // Only reset form on success
        if (response.status === 200 || response.status === 201) {
          setSchedule(undefined);
          setSelectedTaskType('');
          setSelectedSalesPerson('');
          setTaskDescription('');
          setSelectedStatus(''); // Reset status
          setRemark(''); // Reset remark
        }
      }
    } catch (error: any) {
      console.log('API Error:', error.response?.data || error.message);
      
      // For network errors or other exceptions
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to add task',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle task update
  const handleUpdate = async () => {
    if (!remark || !selectedStatus || !updateDateTime) {
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
        remark: remark,
        task_status: selectedStatus,
        completed_at: updateDateTime.toISOString(),
      };

      console.log('Update API Request:', { url, payload });

      const response = await axiosInstance.patch(url, payload);

      console.log('Update API Response:', response.data);

      if (response.data) {
        Toast.show({
          type: response.status === 200 ? 'success' : 'error',
          text1: response.data.message || 'Task updated successfully',
          position: 'bottom'
        });

        // Reset form on success
        if (response.status === 200) {
          setRemark('');
          setSelectedStatus('');
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
            setSchedule(undefined);
            setSelectedTaskType('');
            setSelectedSalesPerson('');
            setTaskDescription('');
            setSelectedStatus('');
            setRemark('');
            setUpdateDateTime(undefined);
          },
        },
      ],
    );
  };

  // Helper to format date as dd-mm-yyyy
  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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

  return (
    <Container>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Lead Information Card */}
        <View style={styles.card}>
          {/* Status Badge */}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Warm</Text>
          </View>

          {/* Lead Details */}
          <Text style={styles.label}>Lead Information</Text>
          <Text style={styles.subLabel}>
            <Text style={styles.boldText}>Full Name :</Text> {safeDecrypt(firm_name)}
          </Text>
          <View style={styles.separator} />

          <Text style={styles.label}>Owner</Text>
          <Text style={styles.subLabel}>{safeDecrypt(client_name)}</Text>
          <View style={styles.separator} />

          <Text style={styles.label}>Assigned to</Text>
          <Text style={styles.subLabel}>{initiator || '-'}</Text>
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
              Followup Details
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
            <Text style={styles.label}>Submit Task Update</Text>

            <DateNTimePicker
              label="Date and Time"
              value={schedule}
              onConfirm={setSchedule}
              containerStyle={{marginTop: scaleHeight(6)}}
            />

            <CustomDropdown
              label="Sales Person Name"
              data={salesPersonList}
              value={selectedSalesPerson}
              onChange={setSelectedSalesPerson}
              containerStyle={{marginTop: scaleHeight(6)}}
            />

            {/* Task Type */}
            <CustomDropdown
              label="Task Type"
              data={[
                {label: 'Call', value: 'call'},
                {label: 'Email', value: 'email'},
                {label: 'Meeting', value: 'meeting'},
              ]}
              containerStyle={{marginTop: scaleHeight(6)}}
              onChange={setSelectedTaskType}
            />

            
            <Input
              label="Task"
              placeholder="Task"
              containerStyle={{marginTop: scaleHeight(6)}}
              value={taskDescription}
              onChangeText={setTaskDescription}
            />

            {/* Status */}
            <CustomDropdown
              label="Status"
              data={[
                {label: 'Pending', value: 'pending'},
                {label: 'Completed', value: 'completed'},
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              containerStyle={{marginTop: scaleHeight(6)}}
            />

            {/* Remark */}
            <Input
              label="Remark"
              placeholder="Enter remark"
              containerStyle={{marginTop: scaleHeight(6)}}
              value={remark}
              onChangeText={setRemark}
            />

            {/* Button Container */}
            <View style={styles.footerButton}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearForm}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>

              <View style={styles.rightButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  activeOpacity={0.7}
                  onPress={handleSubmit}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.saveText}>Submit</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  activeOpacity={0.7}
                  onPress={handleUpdate}
                  disabled={updateLoading}>
                  {updateLoading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.saveText}>Update</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={{marginTop: 20}}>
            <Text style={[styles.label, {marginBottom: 12}]}>Remark Report Overview</Text>
            {loadingRemarkReport ? (
              <ActivityIndicator size="small" color={Colors.green} style={{marginTop: 20}} />
            ) : (
              remarkReportData.length === 0 ? (
                <Text style={{color: '#888', textAlign: 'center'}}>No remark report found.</Text>
              ) : (
                remarkReportData.map(item => (
                  <View key={item.id} style={styles.remarkCard}>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Assigned Date:</Text> {formatDate(item.assigned_at)}
                    </Text>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Assigned By:</Text> {item.assigned_by}
                    </Text>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Assigned To:</Text> {item.assigned_to}
                    </Text>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Client Name:</Text> {item.client_name}
                    </Text>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Task Type:</Text> {item.task_type}
                    </Text>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Description:</Text> {item.task_description}
                    </Text>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Remark:</Text> {item.remark || '-'}
                    </Text>
                    <Text style={styles.remarkLabel}>
                      <Text style={styles.remarkTitle}>Status: </Text>
                      <Text style={[styles.statusValue, getStatusColor(item.task_status)]}>
                        {item.task_status}
                      </Text>
                    </Text>
                  </View>
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
  assignButton: {
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: fontWeight.SemiBold,
  },
  remarkCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  remarkLabel: {
    marginVertical: 2,
    color: '#333',
    fontSize: 13,
  },
  remarkTitle: {
    fontWeight: fontWeight.SemiBold,
  },
  statusValue: {
    fontWeight: fontWeight.Medium,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#028D3E',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    borderWidth: 1,
    borderColor: '#028D3E',
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  clearButton: {
    paddingHorizontal: 10,
  },
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(10),
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
});
