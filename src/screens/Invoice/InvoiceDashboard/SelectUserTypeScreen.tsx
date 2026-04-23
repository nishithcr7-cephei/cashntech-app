import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {RightChevron} from '@assets/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SelectUserTypeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthNavigatorType>>();

  const handleUserTypeSelection = (userType: 'dealer' | 'vendor') => {
    // Map selection to a simple product type used for dynamic labels
    const productType =
      userType === 'dealer' ? 'dealer_finance' : 'vendor_finance';

    // Store selection for later use in invoice screens (UI-only behaviour)
    AsyncStorage.setItem('selectedProductType', productType).finally(() => {
      // Keep existing navigation flow unchanged
      navigation.navigate('HomeNavigator');
    });
  };

  return (
    <Container>
      <AppBar title="Select Program Type" navigation={navigation} hideHamburger={true} />
      <View style={styles.contentContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Select Program Type</Text>
          <Text style={styles.instructionText}>
            Choose the finance program to continue and access the available features.
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleUserTypeSelection('dealer')}>
              <Text style={styles.optionText}>Dealer Finance</Text>
              <RightChevron 
                height={scaleHeight(16)} 
                width={scaleWidth(16)} 
                style={styles.arrowIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleUserTypeSelection('vendor')}>
              <Text style={styles.optionText}>Vendor Finance</Text>
              <RightChevron 
                height={scaleHeight(16)} 
                width={scaleWidth(16)} 
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          </View>
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
  optionText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  arrowIcon: {
    marginLeft: scaleWidth(8),
  },
});

