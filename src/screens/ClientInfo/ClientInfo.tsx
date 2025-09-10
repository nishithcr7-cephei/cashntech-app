import {Filter, Plus, Search} from '@assets/Icons';
import {AppBar, ClientCard, Container, FilterModal} from '@components/index';
import {ClientScreens, Colors, FontWeight} from '@constants/index';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {clientActions, clientSelector} from '@store/client';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useState, useEffect, useMemo} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {LeadSourceType, SectorType} from './ClientInfo.type';
import {userSelector, UserState} from '@store/user';

type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, ClientScreens.ClientInfo>,
  DrawerScreenProps<HomeNavigatorType>
>;

export const ClientInfo: React.FC<NavigationType> = ({navigation}) => {
  const {first_name, last_name}: UserState = useSelector(
    userSelector.getUserInfo,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string[]>
  >({});
  const dispatch = useDispatch();
  const clientsData = useSelector(clientSelector.getClientList);
  const cityList = useSelector(clientSelector.getCityList);
  const loading = useSelector(clientSelector.getClientLoader);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clientsData;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return clientsData.filter(client => {
      const firmName = client.firm_name ?? '';
      return firmName.toString().toLowerCase().includes(lowerCaseQuery);
    });
  }, [clientsData, searchQuery]);

  const filterData = useMemo(() => {
    const listOfSectors = Object.values(SectorType);
    const listOfLeadSources = Object.values(LeadSourceType);
    return {
      City: cityList,
      Sector: listOfSectors,
      'Source of lead': listOfLeadSources,
    };
  }, [cityList]);

  useEffect(() => {
    dispatch(clientActions.getCityList());
  }, [dispatch]);

  useEffect(() => {
    callGetClients();
  }, [appliedFilters, dispatch]);

  const callGetClients = () => {
    dispatch(clientActions.getClients(appliedFilters));
  };

  const onPressFAB = () => {
    dispatch(clientActions.resetAllClientFormData());
    navigation.navigate(ClientScreens.FormSelectionScreen);
  };

  const onPressCard = (clientId: number) => {
    navigation.navigate(ClientScreens.ProfileScreen, {clientId});
  };

  const onEdit = (clientId: number) => {
    dispatch(clientActions.prepareClientForEdit(clientId));
    navigation.navigate(ClientScreens.FormSelectionScreen);
  };
  
  const onDelete = (clientId: number) => {
    dispatch(
      clientActions.deleteClientRequest({
        id: clientId,
        deleted_by: first_name + ' ' + last_name,
      }),
    );
  };

  return (
    <Container>
      <AppBar title="Client Information Master" navigation={navigation} />
      <View style={styles.subContainer}>
        <Text style={styles.Subheader}>Client Information</Text>
      </View>
      <View style={{flex: 1}}>
        {/* Client List Header with search and filter */}
        <View style={styles.RowContainer}>
          <View style={styles.subRowContainer}>
            <Text style={styles.subRowContainerTxt}>Clients</Text>
            <View style={styles.Badge}>
              <Text style={styles.badgeText}>{clientsData.length}</Text>
            </View>
          </View>
          <View style={styles.Searchbox}>
            <Search height={12} width={12} />
            <TextInput
              style={styles.input}
              placeholder="Search Clients"
              placeholderTextColor={Colors.balancedGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <View style={styles.filterBox}>
              <Filter height={12} width={12} />
            </View>
          </TouchableOpacity>
        </View>
        {/* Client List */}
        <View style={styles.cardList}>
          <FlatList
            data={filteredClients}
            contentContainerStyle={{paddingBottom: scaleHeight(56)}}
            renderItem={({item}) => (
              <ClientCard
                key={item.id.toString()}
                data={item}
                onPressCard={onPressCard}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
            refreshing={loading}
            onRefresh={callGetClients}
            ListEmptyComponent={
              <Text style={styles.emptyList}>
                {loading ? 'Loading clients...' : 'No Clients Found'}
              </Text>
            }
          />
        </View>
      </View>

      {/* Filter Model */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        filterData={filterData}
      />

      {/* FAB to add client */}
      <TouchableOpacity style={styles.plusButton} onPress={onPressFAB}>
        <Plus height={24} width={24} />
      </TouchableOpacity>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  subContainer: {
    backgroundColor: '#fff',
  },
  emptyList: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.SteelGray,
    textAlign: 'center',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
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
  subRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subRowContainerTxt: {
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
  badgeText: {
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
    gap: 16,
    paddingHorizontal: 10,
  },
  input: {
    fontSize: scaleFont(12),
  },
  cardList: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 10,
  },
  plusButton: {
    position: 'absolute',
    bottom: scaleHeight(40),
    right: 30,
    backgroundColor: Colors.tertiaryBlue,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBox: {
    width: scaleWidth(32),
    height: scaleHeight(30),
    backgroundColor: Colors.primaryColor,
    marginLeft: scaleWidth(8),
    padding: 10,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
