import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {RightChevron, UpChevron, RightCheckmark, File, BankBuilding} from '@assets/Icons';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {BANKS_DATA, Bank, BankProgram, Program} from '@constants/programSelection';
import {setProgramSelection} from '@store/programSelection/programSelection.slice';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';

// Simple icon components
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
  const dispatch = useDispatch();
  const currentSelection = useSelector(selectProgramSelection);

  // Track which banks/products are expanded
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );

  // Track selected program
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    currentSelection.programId || null,
  );

  const toggleBank = (bankId: string) => {
    const newExpanded = new Set(expandedBanks);
    if (newExpanded.has(bankId)) {
      newExpanded.delete(bankId);
      // Also collapse all products of this bank
      const bank = BANKS_DATA.find(b => b.id === bankId);
      if (bank) {
        bank.products.forEach(product => {
          expandedProducts.delete(`${bankId}_${product.id}`);
        });
        setExpandedProducts(new Set(expandedProducts));
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

  const handleProgramSelect = (bank: Bank, product: BankProgram, program: Program) => {
    // Set selected program
    setSelectedProgramId(program.id);

    // Redux mein save karo
    dispatch(
      setProgramSelection({
        bankId: bank.id,
        bankName: bank.name,
        productId: product.id,
        productName: product.name,
        programId: program.id,
        programName: program.name,
        userType: program.userType,
      }),
    );

    // HomeNavigator par navigate karo
    navigation.navigate('HomeNavigator');
  };

  const isBankExpanded = (bankId: string) => expandedBanks.has(bankId);
  const isProductExpanded = (bankId: string, productId: string) =>
    expandedProducts.has(`${bankId}_${productId}`);
  const isProgramSelected = (programId: string) =>
    selectedProgramId === programId;

  const renderBankItem = (bank: Bank, index: number) => {
    const isExpanded = isBankExpanded(bank.id);
    const isLastBank = index === BANKS_DATA.length - 1;

    return (
      <View key={bank.id}>
        <View style={styles.bankCard}>
          {/* Bank Header */}
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

          {/* Products List (when bank is expanded) */}
          {isExpanded && (
            <View style={styles.productsContainer}>
              {bank.products.map(product => renderProductItem(bank, product))}
            </View>
          )}
        </View>
        {/* Separator between banks */}
        {!isLastBank && <View style={styles.bankSeparator} />}
      </View>
    );
  };

  const renderProductItem = (bank: Bank, product: BankProgram) => {
    const isExpanded = isProductExpanded(bank.id, product.id);

    return (
      <View key={product.id} style={styles.productContainer}>
        {/* Product Header */}
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

        {/* Programs List (when product is expanded) */}
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

    return (
      <TouchableOpacity
        key={program.id}
        style={[
          styles.programItem,
          isSelected && styles.programItemSelected,
        ]}
        onPress={() => handleProgramSelect(bank, product, program)}>
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
            ]}>
            {program.name}
          </Text>
        </View>
        {isSelected && (
          <RightCheckmark
            height={scaleHeight(18)}
            width={scaleWidth(18)}
            color={Colors.primaryColor}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Container>
      <AppBar title="Select Program" navigation={navigation} hideHamburger={true} />
      <View style={styles.contentContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.rootCard}>
            <FlatList
              data={BANKS_DATA}
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
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFEFC',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
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
    paddingLeft: scaleWidth(76), // More indent for program items
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    position: 'relative',
  },
  programItemSelected: {
    backgroundColor: '#FFF9F9', // Light red background for selected
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: scaleWidth(4),
    backgroundColor: Colors.primaryColor, // Red vertical bar
  },
  programItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  programName: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#4A4A4A', // Dark grey for unselected
    flex: 1,
  },
  programNameSelected: {
    fontFamily: Fonts.GilroySemiBold,
    color: '#C41E3A', // Dark red for selected (matching screenshot)
  },
});
