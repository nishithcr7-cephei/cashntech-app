import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {RightChevron, UpChevron, File, BankBuilding} from '@assets/Icons';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import type {Bank, BankProgram, Program} from '@constants/programSelection';
import {
  fetchUserScopeRequest,
  toggleProgramSelection,
  setProgramScope,
} from '@store/programSelection/programSelection.slice';
import {
  selectScopeData,
  selectScopeLoading,
  selectScopeError,
  selectSelectedPrograms,
} from '@store/programSelection/programSelection.selector';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';

const FolderIcon = ({size = 20, color = '#7A7C82'}: {size?: number; color?: string}) => (
  <View style={{width: size, height: size, justifyContent: 'center', alignItems: 'center'}}>
    <View style={{width: size * 0.8, height: size * 0.6, borderRadius: 2, borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent', borderTopLeftRadius: 4, borderTopRightRadius: 4}}>
      <View style={{position: 'absolute', top: -2, left: 2, width: size * 0.3, height: 3, backgroundColor: color, borderRadius: 1}} />
    </View>
  </View>
);

export const SelectProgramScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthNavigatorType>>();
  const route = useRoute<any>();
  const {fromScreen} = route.params || {};
  const dispatch = useDispatch();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCashnTechUser = userRole === 'cashntech_user';
  const canUseAllProgramScope =
    isAnchorMaker || 
    isDealerMaker || 
    isAnchorChecker || 
    isDealerChecker || 
    isCashnTechUser;
  const scopeData = useSelector(selectScopeData);
  const scopeLoading = useSelector(selectScopeLoading);
  const scopeError = useSelector(selectScopeError);
  const selectedPrograms = useSelector(selectSelectedPrograms);

  const banksData = useMemo(() => {
    if (!scopeData) return [];
    return scopeData
      .map(bank => ({
        ...bank,
        products: bank.products
          .map(product => ({
            ...product,
            programs: product.programs,
          })),
      }));
  }, [scopeData]);

  const isDFProgram = (bank: Bank, product: BankProgram, program: Program): boolean => {
    if (canUseAllProgramScope) {
      return true;
    }

    if (bank.name.toLowerCase() === 'ugro') {
      return true;
    }

    const isDFProduct = product.name.toLowerCase().includes('dealer finance');
    const isDFProgramName = program.name.toLowerCase().includes('df') || 
                           program.name.toLowerCase().includes('dealer finance');
    return isDFProduct || isDFProgramName;
  };

  useEffect(() => {
    if (!scopeData || scopeData.length === 0) {
      dispatch(fetchUserScopeRequest());
    }
  }, [dispatch, scopeData]);

  const [delayPassed, setDelayPassed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDelayPassed(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );

  const toggleBank = (bankId: string) => {
    const newExpanded = new Set(expandedBanks);
    if (newExpanded.has(bankId)) {
      newExpanded.delete(bankId);
      const bank = banksData.find(b => b.id === bankId);
      if (bank) {
        const newExpandedProducts = new Set(expandedProducts);
        bank.products.forEach(product => {
          newExpandedProducts.delete(`${bankId}_${product.id}`);
        });
        setExpandedProducts(newExpandedProducts);
      }
    } else {
      newExpanded.add(bankId);
    }
    setExpandedBanks(newExpanded);
  };

  const toggleProduct = (bankId: string, productId: string) => {
    const key = `${bankId}_${productId}`;
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedProducts(newExpanded);
  };

  const handleProgramToggle = (bank: Bank, product: BankProgram, program: Program) => {
    if (!isDFProgram(bank, product, program)) {
      return;
    }
    dispatch(
      toggleProgramSelection({
        bankId: bank.id,
        bankName: bank.name,
        partyId: bank.partyId,
        productId: product.id,
        productName: product.name,
        programId: program.id,
        programName: program.name,
        userType: program.userType,
        method: program.method,
        role: program.role,
        status: program.status,
        approvalLevel: product.approval_level ?? null,
      }),
    );
    if (fromScreen) {
      navigation.navigate(fromScreen);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('HomeNavigator');
    }
  };

  const handleAllProgram = () => {
    dispatch(setProgramScope('all'));
    if (fromScreen) {
      navigation.navigate(fromScreen);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('HomeNavigator');
    }
  };

  const isBankExpanded = (bankId: string) => expandedBanks.has(bankId);
  const isProductExpanded = (bankId: string, productId: string) =>
    expandedProducts.has(`${bankId}_${productId}`);
  const isProgramSelected = (programId: string) =>
    selectedPrograms.some(p => p.programId === programId);
  const isProgramSelectable = (bank: Bank, product: BankProgram, program: Program) =>
    isDFProgram(bank, product, program);

  const renderBankItem = (bank: Bank, index: number) => {
    const isExpanded = isBankExpanded(bank.id);
    const isLastBank = index === banksData.length - 1;

    return (
      <View key={bank.id}>
        <View style={styles.bankCard}>
          <TouchableOpacity
            style={styles.bankHeader}
            onPress={() => toggleBank(bank.id)}>
            <View style={styles.bankHeaderLeft}>
              <View style={styles.iconContainer}>
                <BankBuilding
                  width={scaleWidth(18)}
                  height={scaleWidth(18)}
                  color="#7A7C82"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={styles.bankSubtext}>
                  {bank.products.length} product{bank.products.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            {isExpanded ? (
              <UpChevron height={scaleHeight(16)} width={scaleWidth(16)} />
            ) : (
              <RightChevron height={scaleHeight(16)} width={scaleWidth(16)} />
            )}
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.productsContainer}>
              {bank.products.map(product => renderProductItem(bank, product))}
            </View>
          )}
        </View>
        {!isLastBank && <View style={styles.bankSeparator} />}
      </View>
    );
  };

  const renderProductItem = (bank: Bank, product: BankProgram) => {
    const isExpanded = isProductExpanded(bank.id, product.id);

    return (
      <View key={product.id} style={styles.productContainer}>
        <TouchableOpacity
          style={styles.productHeader}
          onPress={() => toggleProduct(bank.id, product.id)}>
          <View style={styles.productHeaderLeft}>
            <View style={styles.iconContainer}>
              <FolderIcon size={scaleWidth(18)} color="#7A7C82" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productSubtext}>
                {product.programs.length} program{product.programs.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          {isExpanded ? (
            <UpChevron height={scaleHeight(16)} width={scaleWidth(16)} />
          ) : (
            <RightChevron height={scaleHeight(16)} width={scaleWidth(16)} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.programsContainer}>
            {product.programs.map(program =>
              renderProgramItem(bank, product, program),
            )}
          </View>
        )}
      </View>
    );
  };

  const renderProgramItem = (
    bank: Bank,
    product: BankProgram,
    program: Program,
  ) => {
    const isSelected = isProgramSelected(program.id);
    const selectable = isProgramSelectable(bank, product, program);

    return (
      <TouchableOpacity
        key={program.id}
        style={[
          styles.programItem,
          isSelected && styles.programItemSelected,
          !selectable && styles.programItemDisabled,
        ]}
        onPress={() => handleProgramToggle(bank, product, program)}
        disabled={!selectable}>
        <View style={styles.programItemContent}>
          {isSelected && <View style={styles.selectedIndicator} />}
          <View style={styles.iconContainer}>
            <File 
              height={scaleHeight(18)} 
              width={scaleWidth(18)} 
              color={isSelected ? Colors.primaryColor : '#7A7C82'}
            />
          </View>
          <Text
            style={[
              styles.programName,
              isSelected && styles.programNameSelected,
              !selectable && styles.programNameDisabled,
            ]}>
            {program.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (scopeLoading || !delayPassed) {
    return (
      <Container>
        <AppBar title="Select DF Programs" navigation={navigation as any} hideHamburger={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      </Container>
    );
  }

  if (scopeError) {
    return (
      <Container>
        <AppBar title="Select Program" navigation={navigation as any} hideHamburger={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{scopeError}</Text>
        </View>
      </Container>
    );
  }

  if (banksData.length === 0) {
    return (
      <Container>
        <AppBar title="Select Program" navigation={navigation as any} hideHamburger={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No programs available</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <AppBar title="Select DF Programs" navigation={navigation as any} hideHamburger={true} />
      <View style={styles.contentContainer}>
        <View style={styles.contentWrapper}>
          {canUseAllProgramScope && (
            <TouchableOpacity
              style={styles.allProgramBtn}
              onPress={handleAllProgram}
              activeOpacity={0.85}>
              <Text style={styles.allProgramText}>All Program</Text>
              <RightChevron height={scaleHeight(16)} width={scaleWidth(16)} />
            </TouchableOpacity>
          )}
          <View style={styles.rootCard}>
            <FlatList
              data={banksData}
              keyExtractor={item => item.id}
              renderItem={({item, index}) => renderBankItem(item, index)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleHeight(12),
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  errorText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFEFC',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(16),
  },
  allProgramBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(12),
  },
  allProgramText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  listContent: {
    paddingBottom: scaleHeight(24),
  },
  rootCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
  },
  bankCard: {
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  bankSeparator: {
    height: 1,
    backgroundColor: '#E6E6E6',
    marginHorizontal: scaleWidth(16),
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
  bankHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  bankName: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(2),
  },
  bankSubtext: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyRegular,
    color: '#7A7C82',
  },
  productsContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  productContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(16),
    paddingLeft: scaleWidth(48), // Indent for folder icon
  },
  productHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(2),
  },
  productSubtext: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyRegular,
    color: '#7A7C82',
  },
  programsContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(16),
    paddingLeft: scaleWidth(76),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    position: 'relative',
  },
  programItemSelected: {
    backgroundColor: '#FFF9F9',
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: scaleWidth(4),
    backgroundColor: Colors.primaryColor,
  },
  programItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  programName: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#4A4A4A',
    flex: 1,
  },
  programNameSelected: {
    fontFamily: Fonts.GilroySemiBold,
    color: '#C41E3A',
  },
  programItemDisabled: {
    opacity: 0.5,
  },
  programNameDisabled: {
    color: '#9A9A9A',
  },
});
