import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Container, AppBar} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {LeftChevron} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import type {HomeNavigatorType} from '@type/NavigatorTypes';
import {useNavigation, type CompositeNavigationProp} from '@react-navigation/native';
import type {DrawerNavigationProp} from '@react-navigation/drawer';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {logoutUser} from '@services/api/api';
import {useProfile} from './useProfile';

type ProfileNavigation = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType, 'Profile'>,
  NativeStackNavigationProp<any>
>;

function InfoCard({
  icon,
  iconStyle = 'solid',
  label,
  value,
}: {
  icon: string;
  iconStyle?: 'solid' | 'regular';
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.iconBox}>
        <FontAwesome6
          name={icon as any}
          iconStyle={iconStyle}
          color={Colors.graybase}
          size={16}
        />
      </View>
      <View style={styles.infoTextGroup}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
      </View>
    </View>
  );
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigation>();
  const profile = useProfile();

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
        onPressLeftIcon={() =>
          (navigation as any).reset({
            index: 0,
            routes: [{name: 'InvoiceDashboard'}],
          })
        }
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Header — name, entity, status chips (web parity) */}
        <View style={styles.headerSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.nameText} numberOfLines={2}>
              {profile.fullName}
            </Text>
            <Text style={styles.entityText} numberOfLines={2}>
              {profile.entityName}
            </Text>
            <View style={styles.chipRow}>
              {!!profile.userTypeChip && (
                <View style={[styles.chip, styles.chipSoft]}>
                  <Text style={styles.chipSoftText}>{profile.userTypeChip}</Text>
                </View>
              )}
              {profile.isActive && (
                <View style={[styles.chip, styles.chipSoft]}>
                  <Text style={styles.chipSoftText}>Active</Text>
                </View>
              )}
              {profile.isVerified && (
                <View style={[styles.chip, styles.chipOutline]}>
                  <FontAwesome6
                    name="shield-halved"
                    iconStyle="solid"
                    color="#15803D"
                    size={11}
                  />
                  <Text style={styles.chipOutlineText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {profile.loading && !profile.email ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : null}

        {!!profile.error && (
          <TouchableOpacity onPress={profile.refresh} style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {profile.error} · Tap to retry
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoList}>
          <InfoCard
            icon="envelope"
            iconStyle="regular"
            label="Email Address"
            value={profile.email}
          />
          <InfoCard
            icon="phone"
            label="Mobile Number"
            value={profile.mobile}
          />
          <InfoCard
            icon="id-card-clip"
            label="Designation"
            value={profile.designation}
          />
          <InfoCard
            icon="calendar"
            iconStyle="regular"
            label="Member Since"
            value={profile.memberSince}
          />
        </View>

        {/* Roles & Permissions — display only (multi-role switch stays web-only) */}
        <View style={styles.rolesSection}>
          <View style={styles.rolesHeader}>
            <FontAwesome6
              name="users"
              iconStyle="solid"
              color={Colors.darkblack}
              size={14}
            />
            <Text style={styles.rolesTitle}>Roles & Permissions</Text>
          </View>
          {profile.roles.length === 0 ? (
            <Text style={styles.emptyRoles}>No roles assigned</Text>
          ) : (
            profile.roles.map(row => (
              <View key={row.id} style={styles.roleCard}>
                <Text style={styles.roleName} numberOfLines={2}>
                  {row.roleLabel}
                </Text>
                <View style={styles.productChip}>
                  <Text style={styles.productChipText} numberOfLines={2}>
                    {row.productLabel}
                  </Text>
                </View>
              </View>
            ))
          )}
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
    alignItems: 'flex-start',
    marginBottom: scaleHeight(20),
  },
  avatarCircle: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    borderRadius: scaleWidth(35),
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(14),
  },
  avatarText: {
    fontSize: scaleFont(22),
    fontFamily: Fonts.GilroyBold,
    color: Colors.white,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameText: {
    fontSize: scaleFont(20),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(2),
  },
  entityText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: '#6B7280',
    marginBottom: scaleHeight(8),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(6),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(3),
    borderRadius: scaleWidth(999),
  },
  chipSoft: {
    backgroundColor: '#DCFCE7',
  },
  chipSoftText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: '#166534',
  },
  chipOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  chipOutlineText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: '#15803D',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  loadingText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(10),
    marginBottom: scaleHeight(12),
  },
  errorText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.red,
  },
  backButtonContainer: {
    marginRight: scaleWidth(8),
  },
  backButtonCircle: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F3F4F6',
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
    minWidth: 0,
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
  rolesSection: {
    marginTop: scaleHeight(22),
    paddingTop: scaleHeight(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  rolesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  rolesTitle: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  emptyRoles: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleWidth(10),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(14),
    marginBottom: scaleHeight(10),
  },
  roleName: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  productChip: {
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scaleWidth(999),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    backgroundColor: '#F9FAFB',
  },
  productChipText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#374151',
    textAlign: 'center',
  },
  deleteAccountButton: {
    marginTop: scaleHeight(28),
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
