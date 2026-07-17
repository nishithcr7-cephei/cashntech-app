import React, {useMemo, useState} from 'react';
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppBar, Button, Container} from '@components/index';
import {AuthScreens, Colors, Fonts, StorageKeys} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {RightChevron} from '@assets/Icons';
import {useDispatch, useSelector} from 'react-redux';
import {authActions} from '@store/auth';
import {setStorage} from '@services/localStorage';
import {setProgramScope} from '@store/programSelection/programSelection.slice';
import {
  selectAvailableProducts,
} from '@store/product/product.selectors';
import {setActiveProduct} from '@store/product/product.slice';
import type {ResolvedProduct} from '@store/product/product.types';

type ProductSelectionScreenProps = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.ProductSelectionScreen
>;

export const ProductSelectionScreen = ({
  navigation,
}: ProductSelectionScreenProps) => {
  const dispatch = useDispatch();
  const availableProducts = useSelector(selectAvailableProducts);
  const [selected, setSelected] = useState<ResolvedProduct | null>(null);

  const products = useMemo(
    () => availableProducts ?? [],
    [availableProducts],
  );

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const completeSignIn = (product: ResolvedProduct) => {
    dispatch(setActiveProduct(product));
    dispatch(setProgramScope('all'));
    setStorage(StorageKeys.IS_LOGGED_IN, true);
    dispatch(authActions.setIsLoggedIn(true));
  };

  const onConfirm = () => {
    if (!selected) {
      return;
    }
    completeSignIn(selected);
  };

  return (
    <Container>
      <AppBar
        title="Select Product"
        navigation={navigation}
        hideHamburger={true}
      />
      <View style={styles.contentContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Select Product</Text>
          <Text style={styles.instructionText}>
            Choose a product to continue. You can use one product at a time.
          </Text>

          <View style={styles.optionsContainer}>
            {products.map(product => {
              const isSelected = selected?.code === product.code;
              return (
                <TouchableOpacity
                  key={product.id || product.code}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelected(product)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                    {product.name}
                  </Text>
                  <RightChevron
                    height={scaleHeight(16)}
                    width={scaleWidth(16)}
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            buttonText="Continue"
            style={styles.confirmButton}
            onPress={onConfirm}
            disabled={!selected}
          />
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#0066FF',
  },
  contentWrapper: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(24),
  },
  title: {
    fontSize: scaleFont(24),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
  },
  instructionText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.darkblack,
    marginBottom: scaleHeight(32),
    lineHeight: scaleHeight(20),
  },
  optionsContainer: {
    gap: scaleHeight(16),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFE9E9',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#FFD9D9',
  },
  optionButtonSelected: {
    borderColor: Colors.primaryColor,
    backgroundColor: '#FFF0F0',
  },
  optionText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  optionTextSelected: {
    color: Colors.primaryColor,
  },
  arrowIcon: {
    marginLeft: scaleWidth(8),
  },
  confirmButton: {
    marginTop: scaleHeight(32),
  },
});
