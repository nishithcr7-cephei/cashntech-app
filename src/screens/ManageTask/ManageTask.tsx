import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Container, AppBar} from '@components/index';
import TaskCard from '@components/TaskCard/TaskCard';
import TaskFilterModal from '@components/TaskFilterModal/TaskFilterModal';
import ManageTaskHeader from '@components/ManageTaskHeader/ManageTaskHeader';
import Colors from '@constants/Colors';
import {scaleFont} from '@utils/Scale';
import * as mngActions from '@store/mng';
import { mngSelector, TaskRecordItem } from '@store/mng';
import { useManageTaskFilters, useTaskSearch } from '@hooks/index';


export const ManageTask = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');

  // Redux selectors
  const taskRecordsLoading = useSelector(mngSelector.getTaskRecordsLoading);
  const filteredTaskRecords = useSelector(mngSelector.getFilteredTaskRecords);

  // Custom hooks
  const {
    isFilterOpen,
    setIsFilterOpen,
    enabledFilters,
    setEnabledFilters,
    selectedFilters,
    setSelectedFilters,
    salesmanOptions,
    toggleTaskType,
    toggleStatus,
    clearFilters,
    applyFilters,
  } = useManageTaskFilters();

  const { handleSearch } = useTaskSearch();

  const fetchReports = () => {
    dispatch(mngActions.getTaskRecordsList({hasTask: true}));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    handleSearch(searchText);
  }, [searchText]);

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
        onFilterPress={() => setIsFilterOpen(prev => !prev)}
      />

      <TaskFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        enabledFilters={enabledFilters}
        onToggleFilter={(filter: keyof typeof enabledFilters) => setEnabledFilters(prev => ({...prev, [filter]: !prev[filter]}))}
        selectedFilters={selectedFilters}
        onToggleTaskType={toggleTaskType}
        onToggleStatus={toggleStatus}
        onSalesmanChange={(salesman: string) => setSelectedFilters(prev => ({...prev, salesman}))}
        salesmanOptions={salesmanOptions}
        onClearFilters={clearFilters}
        onApplyFilters={applyFilters}
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


