import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import React from 'react';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {MenuIcon} from '@assets/Icons';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ProgramSelectorPill} from '@components/ProgramSelector/ProgramSelectorPill';

export type AppBarProps = {
  title?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleTextStyle?: StyleProp<TextStyle>;
  hideHamburger?: boolean;
  showProgramSelector?: boolean;

  renderLeftIcon?: React.ReactNode;
  onPressLeftIcon?: () => void;
  leftIconProps?: TouchableOpacityProps;
  leftIconContainerStyle?: StyleProp<ViewStyle>;

  navigation?:
    | DrawerNavigationProp<HomeNavigatorType>
    | CompositeNavigationProp<
        NativeStackNavigationProp<
          ClientNavigatorType,
          keyof ClientNavigatorType
        >,
        DrawerNavigationProp<HomeNavigatorType>
      >;
};

export const AppBar = ({
  title = '',
  containerStyle,
  leftIconContainerStyle,
  onPressLeftIcon,
  renderLeftIcon,
  leftIconProps,
  titleTextStyle,
  hideHamburger = false,
  showProgramSelector = false,
  navigation,
}: AppBarProps) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, hideHamburger ? styles.containerCentered : undefined, {paddingTop: insets.top}, containerStyle]}>
      {!hideHamburger && (
        <TouchableOpacity
          onPress={() => {
            if (onPressLeftIcon) {
              onPressLeftIcon();
            } else if (
              navigation &&
              typeof navigation?.toggleDrawer === 'function'
            ) {
              navigation.toggleDrawer();
            }
          }}
          style={[leftIconContainerStyle]}
          {...leftIconProps}>
          {renderLeftIcon ? (
            renderLeftIcon
          ) : (
            <MenuIcon height={scaleWidth(16)} width={scaleHeight(16)} />
          )}
        </TouchableOpacity>
      )}

      <View style={[styles.titleSection, !showProgramSelector && styles.titleSectionFull]}>
        <Text style={[styles.titleText, hideHamburger ? styles.titleTextCentered : undefined, titleTextStyle]} numberOfLines={1}>
          {title}
        </Text>
        {showProgramSelector && <ProgramSelectorPill />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9E9',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    position: 'relative',
    zIndex: 1000,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginStart: scaleWidth(24),
    gap: scaleWidth(12),
  },
  titleSectionFull: {
    justifyContent: 'flex-start',
  },
  titleText: {
    flex: 1,
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroyBold,
    fontSize: scaleFont(20),
  },
  titleTextNoHamburger: {
    marginStart: 0,
  },
  containerCentered: {
    justifyContent: 'center',
  },
  titleTextCentered: {
    marginStart: 0,
    textAlign: 'center',
  },
});
