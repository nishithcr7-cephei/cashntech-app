import {Filter, RightCheckmark, Search} from '@assets/Icons';
import {
  AppBar,
  Container,
  CustomDropdown,
  Input,
  DateNTimePicker,
} from '@components/index';
import {TaskCard} from '@components/TaskCard/TaskCard';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import FontWeight from '@constants/FontWeight';
import fontWeight from '@constants/FontWeight';
import {TextInput} from 'react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {clientActions, clientSelector} from '@store/client';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Api} from '@services/api';
import Toast from 'react-native-toast-message';
import clientApi from '@services/api/client.api';

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

export const TaskLogTabs = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'update' | 'history'>(
    'tasks',
  );
  const navigation = useNavigation<DocNavigationType>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<Date | undefined>();
  const [schedule, setSchedule] = useState<Date | undefined>();
  const dispatch = useDispatch();
  const TaskHitoryData = useSelector(clientSelector.getTaskHistory);
  const reportData = useSelector(clientSelector.getRemarkReport);
  const callgetTaskhistory = () => {
   
    
  };
  useEffect(() => {
    callgetTaskhistory();
  }, []);

  useEffect(() => {
    dispatch(clientActions.getReport());
  }, []);

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
  const [remark, setRemark] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const taskList = reportData.flatMap(report =>
    report.task.map(task => ({
      id: task.id,
      tasktype: task.task_type,
      taskDescription: task.task_description,
      clientId: report.id.toString(),
      clientName: report.client_name,
      location: 'NA',
      referenceDetails: task.remark ?? 'NA',
      sourceDHCO: task.completed_at ?? 'NA',
      status: mapStatus(task.task_status),
      raw: task,
    })),
  );

  useEffect(() => {
    if (selectedTask) {
      setRemark(selectedTask.referenceDetails || '');
      setTaskStatus(selectedTask.raw?.task_status || '');
      setCompletedAt(selectedTask.raw?.completed_at || '');
    } else {
      setRemark('');
      setTaskStatus('');
      setCompletedAt('');
    }
  }, [selectedTask]);

  const handleUpdateSubmit = async () => {
    if (!selectedTask) return;
    try {
      const body: any = {
        remark,
        task_status: taskStatus,
      };
      if (taskStatus === 'completed') {
        body.completed_at = completedAt || new Date().toISOString();
      }
      setIsSubmitting(true);
      const res = await clientApi.taskUpdate(selectedTask.id, body);
      if (res?.data?.statusCode === 201) {
        Toast.show({
          type: 'success',
          text1: res.data.message || 'Task updated successfully',
          visibilityTime: 2000,
        });
        setSelectedTask(null);
        setActiveTab('tasks');
        dispatch(clientActions.getReport());
      } else {
        Toast.show({
          type: 'error',
          text1: res?.data?.message || 'Failed to update task',
          
          visibilityTime: 2000,
        });
      }
    } catch (e: any) {
      let message = 'Failed to update task';
      if (e?.response?.data?.message) {
        message = e.response.data.message;
      } else if (e?.message) {
        message = e.message;
      }
      Toast.show({type: 'error', text1: message, visibilityTime: 2000});
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabContent = () => {
    const capitalizeFirst = (str: string) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    switch (activeTab) {
      case 'tasks':
        return (
          <View>
            <View style={styles.RowContainer}>
              <View style={styles.Subrowcontainer}>
                <Text style={styles.Subrowcontainertxt}>Task</Text>
                <View style={styles.Badge}>
                  <Text style={styles.Badgetext}>{taskList.length}</Text>
                </View>
              </View>
              <View style={styles.Searchbox}>
                <Search height={12} width={12} />
                <TextInput
                  style={styles.input}
                  placeholder="Search Clients"
                  placeholderTextColor={Colors.balancedGray}
                />
              </View>

              <TouchableOpacity>
                <View style={styles.Filterbox}>
                  <Filter height={12} width={12} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.Cardlist}>
              <FlatList
                data={taskList}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <View>
                    <TaskCard
                      tasktype={item.tasktype}
                      taskDescription={item.taskDescription}
                      clientId={item.clientId}
                      clientName={item.clientName}
                      location={item.location}
                      referenceDetails={item.referenceDetails}
                      sourceDHCO={item.sourceDHCO}
                      status={item.status}
                    />
                    <TouchableOpacity
                      style={{
                        alignSelf: 'flex-end',
                        marginBottom: 8,
                        backgroundColor: Colors.primaryColor,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                      onPress={() => {
                        setSelectedTask(item);
                        setActiveTab('update');
                      }}>
                      <Text style={{color: '#fff'}}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={{flexGrow: 1}}
                ListEmptyComponent={
                  isLoading ? (
                    <ActivityIndicator
                      size="large"
                      color={Colors.primaryColor}
                    />
                  ) : (
                    <Text style={styles.emptyList}>No Task Found</Text>
                  )
                }
                refreshing={false}
              />
            </View>
          </View>
        );
      case 'update':
        if (!selectedTask) {
          return (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: 'red', fontWeight: 'bold'}}>
                Please select a task from the list to update.
              </Text>
            </View>
          );
        }
        return (
          <View>
            <Text style={styles.heading}>Submit Task Update</Text>

            <DateNTimePicker
              label="Date and Time"
              value={schedule ? schedule.toISOString() : undefined}
              onConfirm={setSchedule}
            />

            <CustomDropdown
              label="Sales Person Name "
              data={salesmanList}
              value={selectedSalesman}
              onChange={val => setSelectedSalesman(val)}
              containerStyle={{marginTop: scaleHeight(20)}}
            />

            <CustomDropdown
              label="Task Type"
              data={[
                {label: 'Call', value: 'call'},
                {label: 'Email', value: 'email'},
                {label: 'Meeting', value: 'meeting'},
              ]}
              placeholder="Select Task Type"
              containerStyle={{marginTop: scaleHeight(20)}}
            />

            <Input
              label="Task"
              placeholder="Task info"
              containerStyle={{marginTop: scaleHeight(20)}}
              value={selectedTask.taskDescription}
              editable={false}
            />

            <CustomDropdown
              label="Status"
              data={[
                {label: 'PENDING', value: 'pending'},
                {label: 'COMPLETED', value: 'completed'},
              ]}
              placeholder="Select Task Status"
              containerStyle={{marginTop: scaleHeight(20)}}
              value={taskStatus}
              onChange={val => {
                setTaskStatus(val);
                if (val === 'completed') {
                  setCompletedAt(new Date().toISOString());
                } else {
                  setCompletedAt('');
                }
              }}
            />

            <Input
              label="Remark"
              placeholder="Value"
              containerStyle={{marginTop: scaleHeight(20)}}
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.footerButton}>
              {/* Clear All Button */}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setRemark('');
                  setTaskStatus('');
                  setCompletedAt('');
                  setSelectedTask(null);
                  setActiveTab('tasks');
                }}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>


              {/* Save Button */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.saveButton}
                  activeOpacity={0.7}
                  onPress={handleUpdateSubmit}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.saveText}>Submit</Text>
                      <RightCheckmark width={12} height={12} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 'history':
        return (
          <View>
            <View style={styles.RowContainer}>
              <View style={styles.Subrowcontainer}>
                <Text style={styles.Subrowcontainertxt}>Task History</Text>
                <View style={styles.Badge}>
                  <Text style={styles.Badgetext}>{TaskHitoryData.length}</Text>
                </View>
              </View>
              <View style={styles.Searchbox}>
                <Search height={12} width={12} />
                <TextInput
                  style={styles.input}
                  placeholder="Search Clients"
                  placeholderTextColor={Colors.balancedGray}
                />
              </View>
              <View style={styles.Filterbox}>
                <TouchableOpacity>
                  <Filter height={12} width={12} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.Cardlist}>
              <FlatList
                data={TaskHitoryData}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <TaskCard
                    tasktype={capitalizeFirst(item.task_type || '')}
                    taskDescription={item.task_description || ''}
                    clientId={item.client?.toString() ?? ''}
                    clientName={item.client_name || ''}
                    location={undefined}
                    referenceDetails={
                      item.remark && String(item.remark).trim()
                        ? String(item.remark)
                        : 'NA'
                    }
                    sourceDHCO={
                      item.completed_at && String(item.completed_at).trim()
                        ? String(item.completed_at)
                        : 'NA'
                    }
                    status={mapStatus(item.task_status)}
                    historyStatus={item.completed_at ? 'Completed' : 'Pending'}
                    showHistoryStatus={true}
                    historyStatusLabel="Task Status"
                    showReadMore={false}
                  />
                )}
                contentContainerStyle={{flexGrow: 1}}
                onRefresh={callgetTaskhistory}
                ListEmptyComponent={
                  isLoading ? (
                    <ActivityIndicator
                      size="large"
                      color={Colors.primaryColor}
                    />
                  ) : (
                    <Text style={styles.emptyList}>No Task History Found</Text>
                  )
                }
                refreshing={false}
              />
            </View>
          </View>
        );
    }
  };

  return (
    <Container>
      <AppBar title="Task Log" navigation={navigation} />

      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabRow}>
          {['Tasks', 'Update', 'History'].map((label, index) => {
            const key = label.toLowerCase().split(' ')[0] as
              | 'tasks'
              | 'update'
              | 'history';
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setActiveTab(key)}
                style={styles.tab}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === key && styles.activeTabText,
                  ]}>
                  {label}
                </Text>
                {activeTab === key && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
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
    flex: 1,
    flexDirection: 'row',
    height: scaleHeight(29),
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
