import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import Toast from 'react-native-toast-message';
import {
  fetchProgramListRequest,
  programListSelector,
  soaLoadingSelector,
  totalProgramsSelector,
  soaErrorSelector,
  resetSOAState,
} from '@store/soa';
import {
  selectProgramSelection,
  selectAllProgramIds,
} from '@store/programSelection/programSelection.selector';

export const StatementOfAccount: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const programSelection = useSelector(selectProgramSelection);
  const allProgramIds = useSelector(selectAllProgramIds);
  
  const programList = useSelector(programListSelector);
  const loading = useSelector(soaLoadingSelector);
  const totalPrograms = useSelector(totalProgramsSelector);
  const soaError = useSelector(soaErrorSelector);

  // Determine which programIds to use
  const selectedProgramIds = useMemo(() => {
    if (programSelection.programScope === 'all' && allProgramIds) {
      return allProgramIds;
    }
    if (programSelection.programId) {
      return [programSelection.programId];
    }
    return allProgramIds || [];
  }, [programSelection, allProgramIds]);

  useEffect(() => {
    if (soaError && (soaError.toLowerCase().includes('token expired') || soaError.toLowerCase().includes('unauthorized'))) {
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Your token has expired. Please log in again.',
        visibilityTime: 4000,
      });
    } else if (soaError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: soaError,
      });
    }
  }, [soaError]);

  // Fetch program list when programIds change
  useEffect(() => {
    if (selectedProgramIds.length > 0) {
      dispatch(fetchProgramListRequest({programIds: selectedProgramIds, isInitialLoad: true}));
    }
    return () => {
      dispatch(resetSOAState());
    };
  }, [dispatch, selectedProgramIds]);

  const renderProgramItem = ({item, index}: {item: any; index: number}) => {
    const isStatusActive = item.status?.toLowerCase() === 'active';

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.listCard}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Bank Name</Text>
              <TouchableOpacity
                onPress={() =>
                  (navigation as any).navigate('SOADealerList', {
                    programId: item.programId,
                    programIds: item.programId ? [item.programId] : [],
                    programName: item.programName,
                  })
                }>
                <Text style={[styles.infoValue, styles.linkText]}>{item.bankName || '-'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Product Name</Text>
              <Text style={styles.infoValue}>{item.productName || '-'}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Program Name</Text>
              <Text style={styles.infoValue}>{item.programName || '-'}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Primary Party</Text>
              <Text style={styles.infoValue}>{item.partyName || '-'}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Total Sanctioned Amount (₹)</Text>
              <Text style={[styles.infoValue, {color: Colors.primaryColor, fontFamily: Fonts.GilroyBold}]}>
                 {item.totalSanctionedAmount || '₹0.00'}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Total Outstanding</Text>
              <Text
                style={[
                  styles.infoValue,
                  {fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack},
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {`₹ ${Number(item.totalOutstanding || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, isStatusActive ? styles.statusGreen : styles.statusRed]}>
                {item.status || 'N/A'}
              </Text>
            </View>
            {item.createdAt && (
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Created On</Text>
                <Text style={styles.infoValue}>{item.createdAt}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Container>
      <AppBar title="Transactions > Statement of Account (SOA)" navigation={navigation as any} />
      
      
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Statement of Account (SOA)</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.programCountHeader}>
          <Text style={styles.allProgramText}>All Program</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalPrograms}</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Fetching programs...</Text>
          </View>
        )}

        {!loading && programList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No programs found</Text>
          </View>
        )}

        {!loading && programList.length > 0 && (
          <FlatList
            data={programList}
            renderItem={renderProgramItem}
            keyExtractor={(item) => item.programId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  headerTitleContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(16),
  },
  programCountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    gap: scaleWidth(8),
  },
  allProgramText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  countBadge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  countText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(16),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    backgroundColor: Colors.white,
    gap: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
    fontFamily: Fonts.GilroyMedium,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(6),
  },
  filterText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  listContent: {
    paddingBottom: scaleHeight(20),
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: scaleHeight(16),
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
  indexBadge: {
    backgroundColor: '#F7F8FB',
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  indexText: {
    color: Colors.graybase,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
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
  statusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  statusRed: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  loaderFooter: {
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scaleFont(16),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  linkText: {
    color: Colors.tertiaryColor,
    textDecorationLine: 'underline',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleHeight(40),
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
});
