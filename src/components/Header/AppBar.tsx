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

export type AppBarProps = {
  title?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleTextStyle?: StyleProp<TextStyle>;
  hideHamburger?: boolean;

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
  navigation,
}: AppBarProps) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, {paddingTop: insets.top}, containerStyle]}>
      {!hideHamburger && (
        <TouchableOpacity
          onPress={() => {
            if (onPressLeftIcon) {
              onPressLeftIcon();
            } else if (
              navigation &&
              typeof navigation?.openDrawer === 'function'
            ) {
              navigation.openDrawer();
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

      <Text style={[styles.titleText, hideHamburger ? styles.titleTextNoHamburger : undefined, titleTextStyle]} numberOfLines={1}>
        {title}
      </Text>
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
  titleText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroyBold,
    fontSize: scaleFont(20),
    marginStart: scaleWidth(24),
  },
  titleTextNoHamburger: {
    marginStart: 0,
  },
});
