import React from 'react';
import {View, Text, StyleSheet, Image, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import {Container, AppBar} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {userSelector} from '@store/user';
import {AppRole, ROLE_LABELS} from '@constants/roles';
import {UserImg} from '@assets/Images';
import type {HomeNavigatorType} from '@type/NavigatorTypes';
import {useNavigation, type CompositeNavigationProp} from '@react-navigation/native';
import type {DrawerNavigationProp} from '@react-navigation/drawer';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

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
  const mobileToShow = userInfo?.mobile_number || '-';
  const emailToShow = userInfo?.email || '-';

  return (
    <Container style={styles.container}>
      <AppBar title="Profile" navigation={navigation as any} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header with avatar, name, role */}
        <View style={styles.headerCard}>
          <Image source={UserImg} style={styles.avatar} />
          <View style={styles.headerTextBlock}>
            <Text style={styles.nameText} numberOfLines={2}>
              {nameToShow}
            </Text>
            {!!roleLabel && (
              <Text style={styles.roleText} numberOfLines={1}>
                {roleLabel}
              </Text>
            )}
          </View>
        </View>

        {/* Info cards – vertical column layout */}
        <View style={styles.infoColumn}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {emailToShow}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {mobileToShow}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>User Role</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {roleLabel || '-'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Financing Group</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              Dealer Financing Group A
            </Text>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    paddingBottom: scaleHeight(32),
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    marginBottom: scaleHeight(16),
    shadowColor: '#00000020',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: scaleWidth(28),
    marginRight: scaleWidth(12),
  },
  headerTextBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  roleText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  infoColumn: {
    flexDirection: 'column',
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    marginBottom: scaleHeight(12),
    minHeight: scaleHeight(56),
    shadowColor: '#00000010',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  infoLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
    includeFontPadding: false,
  },
  infoValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    includeFontPadding: false,
  },
});

