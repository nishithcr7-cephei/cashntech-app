import {Filter, Search} from '@assets/Icons';
import {AppBar, InboundClientCard, Container, FilterModal} from '@components/index';
import {ClientScreens, Colors, FontWeight} from '@constants/index';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  BackHandler,
  Modal,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {userSelector, UserState} from '@store/user';
import {InboundClientData} from '@components/InboundClientCard';
import {inboundClientActions} from '@store/inboundclient/inboundclient.slice';
import {inboundClientSelectors} from '@store/inboundclient/inboundclient.selector';
import {decryptConditionally} from '@utils/crypto';

type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, ClientScreens.ClientInfo>,
  DrawerScreenProps<HomeNavigatorType>
>;

export const InboundClientList: React.FC<NavigationType> = ({navigation}) => {
  const dispatch = useDispatch();
  const {first_name, last_name}: UserState = useSelector(
    userSelector.getUserInfo,
  );
  
  // Redux state
  const inboundClients = useSelector(inboundClientSelectors.getFilteredClients);
  const loading = useSelector(inboundClientSelectors.getLoading);
  const error = useSelector(inboundClientSelectors.getError);
  const appliedFilters = useSelector(inboundClientSelectors.getAppliedFilters);
  const filterOptions = useSelector(inboundClientSelectors.getFilterOptions);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<InboundClientData | null>(null);
  const stopBackPress = useRef(false);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return inboundClients;
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    return inboundClients.filter((client: InboundClientData) => {
      const companyName = client.company_name ?? '';
      return companyName.trim().toLowerCase().includes(lowerCaseQuery);
    });
  }, [inboundClients, searchQuery]);

  useEffect(() => {
    fetchInboundClients();
  }, []);

  const fetchInboundClients = () => {
    dispatch(inboundClientActions.getInboundClientsRequest() as any);
  };


  const onPressCard = (clientData: InboundClientData) => {
    setSelectedClient(clientData);
    setShowClientModal(true);
  };

  const closeClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  const handleApplyFilters = (filters: Record<string, string[]>) => {
    dispatch(inboundClientActions.filterInboundClientsRequest(filters) as any);
  };


  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchInboundClients();
    }, []),
  );

  // Handle back button when Read More is shown
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (stopBackPress.current) {
          stopBackPress.current = false;
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, []);

  return (
    <Container>
      <AppBar title="Inbound Client Information" navigation={navigation} />
      <View style={styles.subContainer}>
        <Text style={styles.Subheader}>Inbound Client Information</Text>
      </View>
      <View style={{flex: 1}}>
        {/* Client List Header with search and filter */}
        <View style={styles.RowContainer}>
          <View style={styles.subRowContainer}>
            <Text style={styles.subRowContainerTxt}>Inbound Clients</Text>
            <View style={styles.Badge}>
              <Text style={styles.badgeText}>{inboundClients.length}</Text>
            </View>
          </View>
          <View style={styles.Searchbox}>
            <Search height={12} width={12} />
            <TextInput
              style={styles.input}
              placeholder="Search by Firm Name"
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
            renderItem={({item, index}) => (
              <InboundClientCard
                key={item.registration_id}
                data={item}
                onPressCard={onPressCard}
                srNo={index + 1}
              />
            )}
            refreshing={loading}
            onRefresh={fetchInboundClients}
            ListEmptyComponent={
              <Text style={styles.emptyList}>
                {loading ? 'Loading inbound clients...' : 'No Inbound Clients Found'}
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
        onApply={handleApplyFilters}
        filterData={filterOptions}
      />

      {/* Client Details Modal */}
      <Modal
        visible={showClientModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeClientModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Inbound Client</Text>
              <TouchableOpacity onPress={closeClientModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {selectedClient ? (
              <View style={styles.modalContent}>
                <Text style={styles.modalLabel}>
                  <Text style={styles.modalLabelBold}>Sr.No:</Text> {inboundClients.findIndex(client => client.registration_id === selectedClient.registration_id) + 1}
                </Text>
                <Text style={styles.modalLabel}>
                  <Text style={styles.modalLabelBold}>Registration ID:</Text> {selectedClient.registration_id || 'N/A'}
                </Text>
                <Text style={styles.modalLabel}>
                  <Text style={styles.modalLabelBold}>Name of Company:</Text> {decryptConditionally(selectedClient.company_name || '') || 'N/A'}
                </Text>
                <Text style={styles.modalLabel}>
                  <Text style={styles.modalLabelBold}>Sector:</Text> {selectedClient.sector || 'N/A'}
                </Text>
                <Text style={styles.modalLabel}>
                  <Text style={styles.modalLabelBold}>City:</Text> {decryptConditionally(selectedClient.city || '') || 'N/A'}
                </Text>
                <Text style={styles.modalLabel}>
                  <Text style={styles.modalLabelBold}>GST Number:</Text> {decryptConditionally(selectedClient.gst_number || '') || 'N/A'}
                </Text>
                {selectedClient.inboundClient[0] && (
                  <>
                    <Text style={styles.modalLabel}>
                      <Text style={styles.modalLabelBold}>Name of Client:</Text> {decryptConditionally(selectedClient.inboundClient[0].name_of_client || '') || 'N/A'}
                    </Text>
                    <Text style={styles.modalLabel}>
                      <Text style={styles.modalLabelBold}>Contact Number:</Text> {decryptConditionally(selectedClient.inboundClient[0].contact_number || '') || 'N/A'}
                    </Text>
                  </>
                )}
                {selectedClient.inboundApplicants[0] && (
                  <>
                    <Text style={styles.modalLabel}>
                      <Text style={styles.modalLabelBold}>Application Status:</Text> {selectedClient.inboundApplicants[0].application_status || 'N/A'}
                    </Text>
                    <Text style={styles.modalLabel}>
                      <Text style={styles.modalLabelBold}>Overall Status:</Text> {selectedClient.inboundApplicants[0].overall_status || 'N/A'}
                    </Text>
                  </>
                )}
                <Text style={styles.modalLabel}>
                  <Text style={styles.modalLabelBold}>Registration Status:</Text> {selectedClient.registration_status || 'N/A'}
                </Text>
              </View>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.modalLabel}>No client data available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    flex: 1,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(14),
    includeFontPadding: false,
    paddingVertical: 0,
  },
  cardList: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 10,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
  },
  closeButtonText: {
    fontSize: scaleFont(20),
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: scaleFont(14),
    color: '#666666',
    marginBottom: 12,
    lineHeight: scaleFont(20),
  },
  modalLabelBold: {
    fontWeight: FontWeight.SemiBold,
    color: '#333333',
  },
});
