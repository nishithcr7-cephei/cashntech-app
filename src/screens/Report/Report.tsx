import {Filter, Search} from '@assets/Icons';
import {AppBar, Container, FilterDropdown} from '@components/index';
import Colors from '@constants/Colors';
import FontWeight from '@constants/FontWeight';
import fontWeight from '@constants/FontWeight';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {clientActions, clientSelector} from '@store/client';
import {HomeNavigatorType, ReportNavigatorType} from '@type/NavigatorTypes';
import {decryptLocation} from '@utils/crypto';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

type ReportNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<ReportNavigatorType>
>;

type ReportUser = {
  id: number;
  first_name?: string;
  last_name?: string;
};

export const Report = () => {
  const navigation = useNavigation<ReportNavigationType>();
  const dispatch = useDispatch();
  const reportData = useSelector(clientSelector.getRemarkReport);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(reportData);
  const [isLoading, setIsLoading] = useState(false);

  const callGetReport = () => {
    setIsLoading(true);
    dispatch(clientActions.getReport());
  };

  useEffect(() => {
    callGetReport();
  }, []);

  useEffect(() => {
    if (reportData.length > 0) {
      setIsLoading(false);
    }
  }, [reportData]);

  useEffect(() => {
    if (!searchText) {
      setFilteredData(reportData);
    } else {
      setFilteredData(
        reportData.filter(item =>
          item.client_name?.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    }
  }, [searchText, reportData]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterField, setActiveFilterField] = useState<
    'Location' | 'Initiator' | 'Source' | null
  >(null);

  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    initiator: '',
    source: '',
  });

  return (
    <Container>
      <AppBar title="Report" navigation={navigation} />
      {/* Content */}
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Task Management</Text>
      </View>
      
      <View style={styles.RowContainer}>
        <View style={styles.Subrowcontainer}>
          <Text style={styles.Subrowcontainertxt}>Leads</Text>
          <View style={styles.Badge}>
            <Text style={styles.Badgetext}>{reportData.length}</Text>
          </View>
        </View>
        <View style={styles.Searchbox}>
          <Search height={12} width={12} />
          <TextInput
            style={styles.input}
            placeholder="Search Leads"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity>
          <View style={styles.Filterbox}>
            <Filter height={12} width={12} />
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <TouchableWithoutFeedback onPress={() => setIsLoading(false)}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading Reports...</Text>
            <Text style={styles.tapToDismissText}>Tap anywhere to dismiss</Text>
          </View>
        </TouchableWithoutFeedback>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{'Completed'}</Text>
              </View>

              <Text style={styles.label}>
                <Text style={styles.bold}>Lead Name :</Text>{' '}
                {decryptLocation(item.client_name)}
              </Text>
              {/* If you have a visit date field, use it here. Otherwise, you can remove or adjust this line. */}
              {/* <Text style={styles.label}>
                <Text style={styles.bold}>Visit Date :</Text> {item.visit_date ? item.visit_date : 'N/A'}
              </Text> */}
              <Text style={styles.label}>
                <Text style={styles.bold}>Visitor Name :</Text>
                {item.user && typeof item.user === 'object'
                  ? `${(item.user as ReportUser).first_name ?? ''} ${
                      (item.user as ReportUser).last_name ?? ''
                    }`.trim() || 'N/A'
                  : 'N/A'}
              </Text>
              {/* <Text style={styles.label}>
                <Text style={styles.bold}>Visitor Name :</Text>'TODO Visitor name'
              </Text> */}
              <Text style={styles.label}>
                <Text style={styles.bold}>Task Type :</Text>{' '}
                {item.task.map(t => t.task_type).join(', ')}
              </Text>
              <Text style={styles.label}>
                <Text style={styles.bold}>Task Description :</Text>
                {'\n'}
                {item.task.map(t => t.task_description).join(', ')}
              </Text>
              <Text style={styles.label}>
                <Text style={styles.bold}>Remark :</Text>
                {'\n'}
                {item.task
                  .map(t =>
                    t.remark && String(t.remark).trim() ? t.remark : 'NA',
                  )
                  .join(', ')}
              </Text>
            </View>
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.container}
          refreshing={false}
          onRefresh={callGetReport}
          ListEmptyComponent={
            <Text style={styles.emptyList}>No Reports Found</Text>
          }
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  emptyList: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.SteelGray,
    textAlign: 'center',
  },
  RowContainer: {
    marginTop: 10,
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
    paddingHorizontal: 10,
  },
  input: {
    marginLeft: 8,
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
  card: {
    backgroundColor: Colors.LimeGray,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderColor: '#eee',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  statusBadge: {
    backgroundColor: '#28a745',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  label: {
    fontSize: scaleFont(14),
    marginBottom: 4,
    color: Colors.gray300,
  },
  bold: {
    fontWeight: fontWeight.SemiBold,
    color: Colors.graybase,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontWeight: fontWeight.Medium,
  },
  tapToDismissText: {
    marginTop: 8,
    fontSize: scaleFont(12),
    color: Colors.balancedGray,
    fontWeight: fontWeight.Normal,
    fontStyle: 'italic',
  },
});
