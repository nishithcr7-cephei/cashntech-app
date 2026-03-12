import React, {useState} from 'react';
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
import {useDispatch, useSelector} from 'react-redux';
import {userActions, userSelector} from '@store/user';
import {AppRole, ROLE_LABELS, ROLE_BUTTON_COLORS} from '@constants/roles';

const RESTRICTED_ANCHOR_MAKER_ONLY_EMAIL = 'am.rudraksh@cashntech.com';

export const SelectRoleScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthNavigatorType>>();
  const dispatch = useDispatch();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const user = useSelector(userSelector.getUserInfo);
  const userEmail = (user?.email ?? '').trim().toLowerCase();

  // For this email, only Anchor Maker is allowed; other roles are disabled
  const isAnchorMakerOnlyEmail = userEmail === RESTRICTED_ANCHOR_MAKER_ONLY_EMAIL;

  const handleRoleSelection = (role: AppRole) => {
    setSelectedRole(role);
    // Dispatch role to store
    dispatch(userActions.setUserRole(role));
    // Navigate to SelectProgramScreen first, then to HomeNavigator
    navigation.replace('SelectProgramScreen');
  };

  const roleOptions: AppRole[] = [
    'anchor_maker',
    'anchor_checker',
    'dealer_maker',
    'dealer_checker',
    'cashntech_user',
  ];

  const isRoleDisabled = (role: AppRole): boolean =>
    isAnchorMakerOnlyEmail && role !== 'anchor_maker';

  return (
    <Container>
      <AppBar title="Select Role" navigation={navigation} hideHamburger={true} />
      <View style={styles.contentContainer}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Select Role</Text>
          <Text style={styles.instructionText}>
            Choose your role to continue and access the available features.
          </Text>

          <View style={styles.optionsContainer}>
            {roleOptions.map((role) => {
              const isSelected = selectedRole === role;
              const disabled = isRoleDisabled(role);
              const roleColors = ROLE_BUTTON_COLORS[role];
              return (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected ? Colors.primaryColor : roleColors.bg,
                      borderColor: isSelected ? Colors.primaryColor : roleColors.border,
                      opacity: disabled ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => !disabled && handleRoleSelection(role)}
                  disabled={disabled}
                  activeOpacity={disabled ? 1 : 0.7}>
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: disabled ? Colors.gray300 : (isSelected ? Colors.white : roleColors.text),
                      },
                    ]}>
                    {ROLE_LABELS[role]}
                  </Text>
                  {!disabled && (
                    <RightChevron 
                      height={scaleHeight(16)} 
                      width={scaleWidth(16)} 
                      style={styles.arrowIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
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
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
  },
  optionText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
  },
  arrowIcon: {
    marginLeft: scaleWidth(8),
  },
});
