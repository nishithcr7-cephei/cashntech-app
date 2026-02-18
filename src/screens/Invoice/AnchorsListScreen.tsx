import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AppBar, Container, FilterModal, ProgramBreadcrumb} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter} from '@assets/Icons';

// Sample data for Anchors List
const anchorsData = [
  {
    id: '1',
    anchorName: 'Anchor Company A',
    companyUniqueId: '123101010',
    creditAccount: 'AMC123123',
    creditTo: '98752000',
  },
  {
    id: '2',
    anchorName: 'Anchor Company B',
    companyUniqueId: '12355253',
    creditAccount: 'AMH123541',
    creditTo: '67852000',
  },
  {
    id: '3',
    anchorName: 'Anchor Company C',
    companyUniqueId: '123101011',
    creditAccount: 'AMC123124',
    creditTo: '98752001',
  },
  {
    id: '4',
    anchorName: 'Anchor Company D',
    companyUniqueId: '123101012',
    creditAccount: 'AMC123125',
    creditTo: '98752002',
  },
  {
    id: '5',
    anchorName: 'Anchor Company E',
    companyUniqueId: '123101013',
    creditAccount: 'AMC123126',
    creditTo: '98752003',
  },
];

// Dummy filter data for Anchors List
const anchorsFilterData = {
  'Anchor Name': ['Anchor Company A', 'Anchor Company B', 'Anchor Company C', 'Anchor Company D', 'Anchor Company E'],
  'Credit Account': ['AMC123123', 'AMH123541', 'AMC123124', 'AMC123125', 'AMC123126'],
  'Company Unique ID': ['123101010', '12355253', '123101011', '123101012', '123101013'],
};

export const AnchorsListScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  // Get company name from route params if available, otherwise use default
  const companyName =
    (route.params as any)?.companyName || '(Company Name)';

  const filteredData = useMemo(() => {
    let data = anchorsData;
    
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          item.anchorName.toLowerCase().includes(term) ||
          item.companyUniqueId.toLowerCase().includes(term) ||
          item.creditAccount.toLowerCase().includes(term) ||
          item.creditTo.toLowerCase().includes(term),
      );
    }

    return data;
  }, [searchText]);

  return (
    <Container>
      <AppBar title="Anchor List" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Anchor List of {companyName}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Anchors Badge Header */}
        <View style={styles.anchorsHeader}>
          <View style={styles.anchorsBadgeContainer}>
            <Text style={styles.anchorsLabel}>Anchors</Text>
            <View style={styles.anchorsBadge}>
              <Text style={styles.anchorsBadgeText}>{filteredData.length}</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter Toolbar */}
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Search width={scaleWidth(18)} height={scaleHeight(18)} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.graybase}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}>
            <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Anchor List - Vertical Card View */}
        <View style={styles.verticalList}>
          {filteredData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.anchorName}</Text>
                  <Text style={styles.cardSubtitle}>
                    Company Unique ID: {row.companyUniqueId}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>
                    Company's Unique Identification No
                  </Text>
                  <Text style={styles.infoValue}>{row.companyUniqueId}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Credit Account</Text>
                  <Text style={styles.infoValue}>{row.creditAccount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Credit to</Text>
                  <Text style={styles.infoValue}>{row.creditTo}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          // TODO: Apply filters to data later
        }}
        filterData={anchorsFilterData}
        appliedFilters={appliedFilters}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  anchorsHeader: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  anchorsBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  anchorsLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  anchorsBadge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  anchorsBadgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    backgroundColor: Colors.white,
    gap: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  verticalList: {
    gap: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardSubtitle: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginTop: scaleHeight(4),
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  infoColumn: {
    width: '47%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(12),
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
});
