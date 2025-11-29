import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {AuthScreens} from '@constants/Screens';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type MenuPageViewNavigationProp = NativeStackNavigationProp<
  AuthNavigatorType,
  'RegisterView'
>;

const MenuPageView: React.FC = () => {
  const navigation = useNavigation<MenuPageViewNavigationProp>();

  const menuOptions = [
    {
      id: 1,
      title: 'Register Your Company',
      subtitle: 'Get started with company registration',
      screen: AuthScreens.RegisterView,
      icon: '🏢',
      color: Colors.primaryColor,
    },
    {
      id: 2,
      title: 'Apply Now',
      subtitle: 'Submit your application quickly',
      screen: AuthScreens.ApplyView,
      icon: '📝',
      color: Colors.tertiaryColor,
    },
    {
      id: 3,
      title: 'Contact Us',
      subtitle: 'Get in touch with our team',
      screen: AuthScreens.OcrInvoice,
      icon: '📞',
      color: Colors.green,
    },
  ];

  const handleNavigation = (screen: keyof AuthNavigatorType) => {
    navigation.navigate(screen as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to CashnTech</Text>
        <Text style={styles.headerSubtitle}>
          Choose an option to get started
        </Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        {menuOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.menuCard, {borderLeftColor: option.color}]}
            onPress={() => handleNavigation(option.screen)}
            activeOpacity={0.8}>
            <View style={styles.menuContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{option.icon}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.menuTitle}>{option.title}</Text>
                <Text style={styles.menuSubtitle}>{option.subtitle}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Need help? Our support team is here to assist you.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: scaleWidth(24),
    paddingTop: scaleHeight(40),
    paddingBottom: scaleHeight(32),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFont(28),
    fontFamily: Fonts.GilroyBold,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: scaleHeight(8),
  },
  headerSubtitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
    textAlign: 'center',
    lineHeight: scaleFont(22),
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(16),
    borderLeftWidth: scaleWidth(4),
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(20),
  },
  iconContainer: {
    width: scaleWidth(50),
    height: scaleWidth(50),
    borderRadius: scaleWidth(25),
    backgroundColor: Colors.LimeGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
  },
  icon: {
    fontSize: scaleFont(24),
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.black,
    marginBottom: scaleHeight(4),
  },
  menuSubtitle: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
    lineHeight: scaleFont(20),
  },
  arrowContainer: {
    width: scaleWidth(30),
    height: scaleWidth(30),
    borderRadius: scaleWidth(15),
    backgroundColor: Colors.LimeGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  footer: {
    paddingHorizontal: scaleWidth(24),
    paddingBottom: scaleHeight(32),
    alignItems: 'center',
  },
  footerText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
    textAlign: 'center',
    lineHeight: scaleFont(20),
  },
});

export default MenuPageView;
