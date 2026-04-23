import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {RightChevron, UpChevron, File, BankBuilding} from '@assets/Icons';
import type {Bank, BankProgram, Program} from '@constants/programSelection';
import {fetchUserScopeRequest, toggleProgramSelection} from '@store/programSelection/programSelection.slice';
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
      <View style={{position: 'absolute' as const, top: -2, left: 2, width: size * 0.3, height: 3, backgroundColor: color, borderRadius: 1}} />
    </View>
  </View>
);

type SelectProgramModalProps = {
  visible: boolean;
  onClose: () => void;
  onProgramSelected: () => void;
};

export const SelectProgramModal: React.FC<SelectProgramModalProps> = ({
  visible,
  onClose,
  onProgramSelected,
}) => {
  const dispatch = useDispatch();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const canUseAllProgramScope =
    userRole === 'anchor_maker' ||
    userRole === 'dealer_maker' ||
    userRole === 'anchor_checker' ||
    userRole === 'dealer_checker' ||
    userRole === 'cashntech_user';
  const scopeData = useSelector(selectScopeData);
  const scopeLoading = useSelector(selectScopeLoading);
  const scopeError = useSelector(selectScopeError);
  const selectedPrograms = useSelector(selectSelectedPrograms);

  const banksData = useMemo(() => {
    if (!scopeData) return [];
    return scopeData.map(bank => ({
      ...bank,
      products: bank.products.map(product => ({...product, programs: product.programs})),
    }));
  }, [scopeData]);

  const isDFProgram = (bank: Bank, product: BankProgram, program: Program): boolean => {
    if (canUseAllProgramScope) return true;
    if (bank.name.toLowerCase() === 'ugro') return true;
    const isDFProduct = product.name.toLowerCase().includes('dealer finance');
    const isDFProgramName =
      program.name.toLowerCase().includes('df') ||
      program.name.toLowerCase().includes('dealer finance');
    return isDFProduct || isDFProgramName;
  };

  useEffect(() => {
    if (visible) {
      dispatch(fetchUserScopeRequest());
    }
  }, [visible, dispatch]);

  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const toggleBank = (bankId: string) => {
    const newExpanded = new Set(expandedBanks);
    if (newExpanded.has(bankId)) {
      newExpanded.delete(bankId);
      const bank = banksData.find(b => b.id === bankId);
      if (bank) {
        const next = new Set(expandedProducts);
        bank.products.forEach(p => next.delete(`${bankId}_${p.id}`));
        setExpandedProducts(next);
      }
    } else {
      newExpanded.add(bankId);
    }
    setExpandedBanks(newExpanded);
  };

  const toggleProduct = (bankId: string, productId: string) => {
    const key = `${bankId}_${productId}`;
    const next = new Set(expandedProducts);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedProducts(next);
  };

  const handleProgramSelect = (bank: Bank, product: BankProgram, program: Program) => {
    if (!isDFProgram(bank, product, program)) return;
    dispatch(
      toggleProgramSelection({
        bankId: bank.id,
        bankName: bank.name,
        productId: product.id,
        productName: product.name,
        programId: program.id,
        programName: program.name,
        userType: program.userType,
        partyId: ''
      }),
    );
    onProgramSelected();
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
        <View style={modalStyles.bankCard}>
          <TouchableOpacity style={modalStyles.bankHeader} onPress={() => toggleBank(bank.id)}>
            <View style={modalStyles.bankHeaderLeft}>
              <View style={modalStyles.iconContainer}>
                <BankBuilding width={scaleWidth(18)} height={scaleWidth(18)} color="#7A7C82" />
              </View>
              <View style={modalStyles.textContainer}>
                <Text style={modalStyles.bankName}>{bank.name}</Text>
                <Text style={modalStyles.bankSubtext}>
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
            <View style={modalStyles.productsContainer}>
              {bank.products.map(product => (
                <View key={product.id} style={modalStyles.productContainer}>
                  <TouchableOpacity
                    style={modalStyles.productHeader}
                    onPress={() => toggleProduct(bank.id, product.id)}>
                    <View style={modalStyles.productHeaderLeft}>
                      <View style={modalStyles.iconContainer}>
                        <FolderIcon size={scaleWidth(18)} color="#7A7C82" />
                      </View>
                      <View style={modalStyles.textContainer}>
                        <Text style={modalStyles.productName}>{product.name}</Text>
                        <Text style={modalStyles.productSubtext}>
                          {product.programs.length} program{product.programs.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    {isProductExpanded(bank.id, product.id) ? (
                      <UpChevron height={scaleHeight(16)} width={scaleWidth(16)} />
                    ) : (
                      <RightChevron height={scaleHeight(16)} width={scaleWidth(16)} />
                    )}
                  </TouchableOpacity>
                  {isProductExpanded(bank.id, product.id) && (
                    <View style={modalStyles.programsContainer}>
                      {product.programs.map(program => {
                        const isSelected = isProgramSelected(program.id);
                        const selectable = isProgramSelectable(bank, product, program);
                        return (
                          <TouchableOpacity
                            key={program.id}
                            style={[
                              modalStyles.programItem,
                              isSelected && modalStyles.programItemSelected,
                              !selectable && modalStyles.programItemDisabled,
                            ]}
                            onPress={() => handleProgramSelect(bank, product, program)}
                            disabled={!selectable}>
                            <View style={modalStyles.programItemContent}>
                              {isSelected && <View style={modalStyles.selectedIndicator} />}
                              <View style={modalStyles.iconContainer}>
                                <File
                                  height={scaleHeight(18)}
                                  width={scaleWidth(18)}
                                  color={isSelected ? Colors.primaryColor : '#7A7C82'}
                                />
                              </View>
                              <Text
                                style={[
                                  modalStyles.programName,
                                  isSelected && modalStyles.programNameSelected,
                                  !selectable && modalStyles.programNameDisabled,
                                ]}>
                                {program.name}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        {!isLastBank && <View style={modalStyles.bankSeparator} />}
      </View>
    );
  };

  const modalContent = () => {
    if (scopeLoading) {
      return (
        <View style={modalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={modalStyles.loadingText}>Loading programs...</Text>
        </View>
      );
    }
    if (scopeError) {
      return (
        <View style={modalStyles.errorContainer}>
          <Text style={modalStyles.errorText}>{scopeError}</Text>
        </View>
      );
    }
    if (banksData.length === 0) {
      return (
        <View style={modalStyles.errorContainer}>
          <Text style={modalStyles.errorText}>No programs available</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={banksData}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => renderBankItem(item, index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={modalStyles.listContent}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.modalBox} onPress={e => e.stopPropagation()}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Select Program</Text>
            <Text style={modalStyles.modalSubtitle}>
              Choose a program to create invoice
            </Text>
          </View>
          <View style={modalStyles.modalBody}>{modalContent()}</View>
          <View style={modalStyles.modalFooter}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(16),
  },
  modalBox: {
    width: '100%',
    maxWidth: scaleWidth(400),
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  modalSubtitle: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginTop: scaleHeight(4),
  },
  modalBody: {
    maxHeight: scaleHeight(400),
  },
  modalFooter: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  cancelBtn: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
    borderRadius: scaleWidth(8),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignSelf: 'flex-end',
  },
  cancelBtnText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  loadingContainer: {
    padding: scaleHeight(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    marginTop: scaleHeight(8),
  },
  errorContainer: {
    padding: scaleHeight(24),
    alignItems: 'center',
  },
  errorText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    paddingBottom: scaleHeight(24),
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
    paddingLeft: scaleWidth(48),
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
