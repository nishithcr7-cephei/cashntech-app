import React, {useMemo, useState} from 'react';
import {
  BackHandler,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppBar, Button, Container} from '@components/index';
import {AuthScreens, Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {useDispatch, useSelector} from 'react-redux';
import {selectAvailableProducts} from '@store/product/product.selectors';
import {setActiveProduct} from '@store/product/product.slice';
import type {ResolvedProduct} from '@store/product/product.types';
import {
  isProductNavLocked,
  uniqueProductsByCode,
} from '@store/product/product.resolver';
import {ProductSelectionRow} from './components/ProductSelectionRow';

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
    () => uniqueProductsByCode(availableProducts ?? []),
    [availableProducts],
  );

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const completeSignIn = (product: ResolvedProduct) => {
    if (isProductNavLocked(product.code)) {
      return;
    }
    dispatch(setActiveProduct(product));
    // Stay in auth stack — Select Program comes next, then login completes there.
    navigation.replace('SelectProgramScreen');
  };

  const onConfirm = () => {
    if (!selected || isProductNavLocked(selected.code)) {
      return;
    }
    completeSignIn(selected);
  };

  const renderProductRow = ({item}: {item: ResolvedProduct}) => {
    const locked = isProductNavLocked(item.code);
    return (
      <ProductSelectionRow
        product={item}
        selected={selected?.code === item.code}
        disabled={locked}
        onPress={() => {
          if (!locked) {
            setSelected(item);
          }
        }}
      />
    );
  };

  return (
    <Container>
      <AppBar
        title="Select Product"
        navigation={navigation}
        hideHamburger={true}
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Choose a product to continue</Text>
          {products.length > 0 ? (
            <Text style={styles.countText}>
              {products.length} product{products.length === 1 ? '' : 's'} available
            </Text>
          ) : null}
        </View>

        <FlatList
          data={products}
          keyExtractor={item => item.id || item.code}
          renderItem={renderProductRow}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.footer}>
          <Button
            buttonText="Continue"
            onPress={onConfirm}
            disabled={!selected}
          />
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(8),
  },
  subtitle: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyRegular,
    color: '#757575',
    lineHeight: scaleHeight(20),
  },
  countText: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: '#9E9E9E',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(8),
    paddingBottom: scaleHeight(8),
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
});
