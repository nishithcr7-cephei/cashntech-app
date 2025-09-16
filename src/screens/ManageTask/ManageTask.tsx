import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Container, AppBar, FilterModal} from '@components/index';
import TaskCard from '@components/TaskCard/TaskCard';
import ManageTaskHeader from '@components/ManageTaskHeader/ManageTaskHeader';
import Colors from '@constants/Colors';
import {scaleFont} from '@utils/Scale';
import {decryptLocation} from '@utils/crypto';
import * as mngActions from '@store/mng';
import { mngSelector, TaskRecordItem } from '@store/mng';


export const ManageTask = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [taskTypeOptions, setTaskTypeOptions] = useState<string[]>([]);
  const [salesmanOptions, setSalesmanOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  // Redux selectors
  const taskRecordsLoading = useSelector(mngSelector.getTaskRecordsLoading);
  const taskRecordsList = useSelector(mngSelector.getTaskRecordsList);
  const salesmanList = useSelector(mngSelector.getSalesmanList);

  const fetchReports = () => {
    dispatch(mngActions.getTaskRecordsList({hasTask: true}));
  };

  // Prepare filter data
  const filterData = {
    'Task Type': taskTypeOptions,
    'Salesman': salesmanOptions,
    'Status': statusOptions,
    'Sector': ['FMCG', 'Paint', 'Manufacturing', 'Pharma', 'Electronic'],
    'Month/Year': [], // Will be handled specially
  };

  // Filtered records based on search and filters
  const filteredTaskRecords = useMemo(() => {
    let filtered = taskRecordsList || [];
    
    // Apply search filter
    if (searchText) {
      const term = searchText.toLowerCase();
      filtered = filtered.filter((it: TaskRecordItem) => {
        const firm = decryptLocation(it.firm_name || '').toLowerCase();
        const user = it.user ? `${it.user.first_name || ''} ${it.user.last_name || ''}`.trim().toLowerCase() : '';
        const taskTypes = (it.task || []).map((t: any) => (t.task_type || '').toLowerCase()).join(' ');
        const statuses = (it.task || []).map((t: any) => (t.task_status || '').toLowerCase()).join(' ');
        return (
          firm.includes(term) ||
          user.includes(term) ||
          taskTypes.includes(term) ||
          statuses.includes(term)
        );
      });
    }
    
    // Apply other filters
    if (appliedFilters['Task Type'] && appliedFilters['Task Type'].length > 0) {
      filtered = filtered.filter((it: TaskRecordItem) => {
        const taskTypes = (it.task || []).map((t: any) => t.task_type || '').filter(Boolean);
        return appliedFilters['Task Type'].some(type => taskTypes.includes(type));
      });
    }
    
    if (appliedFilters['Salesman'] && appliedFilters['Salesman'].length > 0) {
      filtered = filtered.filter((it: TaskRecordItem) => {
        const salesman = it.user ? `${it.user.first_name || ''} ${it.user.last_name || ''}`.trim() : '';
        return appliedFilters['Salesman'].includes(salesman);
      });
    }
    
    if (appliedFilters['Status'] && appliedFilters['Status'].length > 0) {
      filtered = filtered.filter((it: TaskRecordItem) => {
        const statuses = (it.task || []).map((t: any) => t.task_status || '').filter(Boolean);
        return appliedFilters['Status'].some(status => statuses.includes(status));
      });
    }
    
    if (appliedFilters['Sector'] && appliedFilters['Sector'].length > 0) {
      filtered = filtered.filter((it: TaskRecordItem) => {
        const sector = it.sector || '';
        return appliedFilters['Sector'].includes(sector);
      });
    }
    
    if (appliedFilters['Month/Year'] && appliedFilters['Month/Year'].length > 0) {
      filtered = filtered.filter((it: TaskRecordItem) => {
        // Use created_at if available, otherwise fall back to first task's assigned_at
        const dateToUse = it.created_at || it.task?.[0]?.assigned_at;
        if (!dateToUse) return false;
        
        const taskDate = new Date(dateToUse);
        const taskYear = taskDate.getFullYear();
        const taskMonth = taskDate.getMonth() + 1; // getMonth() returns 0-11
        
        return appliedFilters['Month/Year'].some((monthYear: string) => {
          // monthYear format: "2025-08" (year-month)
          const [year, month] = monthYear.split('-').map(Number);
          return taskYear === year && taskMonth === month;
        });
      });
    }
    
    return filtered;
  }, [taskRecordsList, searchText, appliedFilters]);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    // Build filter options from task records
    const taskTypes = new Set<string>();
    const statuses = new Set<string>();
    (taskRecordsList || []).forEach((r: TaskRecordItem) => {
      (r.task || []).forEach((t: any) => {
        if (t?.task_type) taskTypes.add(t.task_type);
        if (t?.task_status) statuses.add(t.task_status);
      });
    });
    setTaskTypeOptions(Array.from(taskTypes));
    setStatusOptions(Array.from(statuses));
  }, [taskRecordsList]);

  useEffect(() => {
    // Update salesman options when salesman list changes
    if (salesmanList && salesmanList.length > 0) {
      const names: string[] = salesmanList
        .map((item: any) => `${item.first_name || ''} ${item.last_name || ''}`.trim())
        .filter(Boolean);
      const uniqueNames = Array.from(new Set(names));
      setSalesmanOptions(uniqueNames);
    }
  }, [salesmanList]);

  useEffect(() => {
    // Fetch salesman list
    dispatch(mngActions.getSalesmanList());
  }, [dispatch]);

  const renderItem = ({item, index}: {item: TaskRecordItem; index: number}) => (
    <TaskCard item={item} index={index} />
  );


  return (
    <Container>
      <AppBar title="Manage Task" navigation={navigation as any} />
      
      <ManageTaskHeader
        taskCount={filteredTaskRecords.length}
        searchText={searchText}
        onSearchChange={setSearchText}
        onFilterPress={() => setShowFilterModal(true)}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        filterData={filterData}
      />

      {taskRecordsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={filteredTaskRecords}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={{padding: 16}}
          ListEmptyComponent={<Text style={styles.empty}>No Reports Found</Text>}
          onRefresh={fetchReports}
          refreshing={taskRecordsLoading}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  empty: { textAlign: 'center', color: Colors.SteelGray, fontSize: scaleFont(16) },
});

export default ManageTask;


