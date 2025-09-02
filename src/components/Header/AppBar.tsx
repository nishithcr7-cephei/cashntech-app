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

export type AppBarProps = {
  title?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleTextStyle?: StyleProp<TextStyle>;

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
  navigation,
}: AppBarProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
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

      <Text style={[styles.titleText, titleTextStyle]} numberOfLines={1}>
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
  },
  titleText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroyBold,
    fontSize: scaleFont(20),
    marginStart: scaleWidth(24),
  },
});
