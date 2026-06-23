import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import {Container, AppBar} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {LeftChevron} from '@assets/Icons';
import {userSelector} from '@store/user';
import {AppRole, ROLE_LABELS} from '@constants/roles';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import type {HomeNavigatorType} from '@type/NavigatorTypes';
import {useNavigation, type CompositeNavigationProp} from '@react-navigation/native';
import type {DrawerNavigationProp} from '@react-navigation/drawer';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {logoutUser} from '@services/api/api';

type ProfileNavigation = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType, 'Profile'>,
  NativeStackNavigationProp<any>
>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigation>();
  const userInfo = useSelector(userSelector.getUserInfo);
  const fullName = useSelector(userSelector.getFullName);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const roleLabel = userRole ? ROLE_LABELS[userRole] : '';

  const nameToShow = fullName?.trim() || `${userInfo?.first_name ?? ''} ${userInfo?.last_name ?? ''}`.trim() || 'User Name';
  const firstLetter = nameToShow.charAt(0).toUpperCase();
  const mobileToShow = userInfo?.mobile_number || '-';
  const emailToShow = userInfo?.email || '-';
  const entityName = userInfo?.entity_name || userInfo?.partner_name || 'Ambica Medical Corporation';
  const workflowName = 'Dealer Finance > Push > Dealer-workflow';

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => logoutUser(),
        },
      ],
    );
  };

  return (
    <Container style={styles.container}>
      <AppBar 
        title="Profile" 
        navigation={navigation as any} 
        hideHamburger={true}
        leftIconContainerStyle={styles.backButtonContainer}
        renderLeftIcon={
          <View style={styles.backButtonCircle}>
            <LeftChevron width={scaleWidth(14)} height={scaleHeight(14)} />
          </View>
        }
        onPressLeftIcon={() => (navigation as any).reset({
          index: 0,
          routes: [{name: 'InvoiceDashboard'}],
        })}
      />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header with circular letter avatar, name, entity */}
        <View style={styles.headerSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.nameText} numberOfLines={1}>
              {nameToShow}
            </Text>
            <Text style={styles.entityText} numberOfLines={1}>
              {entityName}
            </Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.infoList}>
          {/* Email */}
          <View style={styles.infoCard}>
            <View style={styles.iconBox}>
              <FontAwesome6 name="envelope" iconStyle="regular" color={Colors.graybase} size={16} />
            </View>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{emailToShow}</Text>
            </View>
          </View>

          {/* Mobile */}
          <View style={styles.infoCard}>
            <View style={styles.iconBox}>
              <FontAwesome6 name="phone" iconStyle="solid" color={Colors.graybase} size={16} />
            </View>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{mobileToShow}</Text>
            </View>
          </View>

          {/* User Role */}
          <View style={styles.infoCard}>
            <View style={styles.iconBox}>
              <FontAwesome6 name="id-card-clip" iconStyle="solid" color={Colors.graybase} size={16} />
            </View>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>User Role</Text>
              <Text style={styles.infoValue}>{roleLabel || '-'}</Text>
            </View>
          </View>

          {/* Workflow Name */}
          <View style={styles.infoCard}>
            <View style={styles.iconBox}>
              <FontAwesome6 name="users-gear" iconStyle="solid" color={Colors.graybase} size={16} />
            </View>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Workflow Name</Text>
              <Text style={styles.infoValue}>{workflowName}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          activeOpacity={0.8}
          onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(20),
    paddingBottom: scaleHeight(32),
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(24),
  },
  avatarCircle: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    borderRadius: scaleWidth(35),
    backgroundColor: '#D6558C', // Web-like pink
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
  },
  avatarText: {
    fontSize: scaleFont(30),
    fontFamily: Fonts.GilroyBold,
    color: Colors.white,
  },
  headerTextBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: scaleFont(22),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  entityText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#666666',
  },
  backButtonContainer: {
    marginRight: scaleWidth(8),
  },
  backButtonCircle: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F3F4F6', // Light gray background like the screenshot
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoList: {
    gap: scaleHeight(12),
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconBox: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(8),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: '#6B7280',
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  deleteAccountButton: {
    marginTop: scaleHeight(32),
    backgroundColor: Colors.red,
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});

