import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {BankBuilding, Folder, File, RightChevron, EditIcon} from '@assets/Icons';
import {
  selectIsProgramSelected,
} from '@store/programSelection/programSelection.selector';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';

export const ProgramBreadcrumb: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthNavigatorType>>();
  const isSelected = useSelector(selectIsProgramSelected);
  const selection = useSelector(selectProgramSelection);

  if (
    !isSelected ||
    !selection.bankName ||
    !selection.productName ||
    !selection.programName
  )
    return null;

  const bankLabel =
    selection.bankName.toLowerCase().includes('tata capital') ? 'TCL' : selection.bankName;
  const productLabel =
    selection.productName.toLowerCase().includes('dealer finance')
      ? 'DF'
      : selection.productName;

  return (
    <View style={styles.breadcrumbContainer}>
      <TouchableOpacity
        style={styles.breadcrumbButton}
        activeOpacity={0.75}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        accessibilityRole="button"
        accessibilityLabel="Change selected bank and program"
        accessibilityHint="Double tap to open select program screen"
        onPress={() => navigation.navigate('SelectProgramScreen')}>
        <View style={styles.row} pointerEvents="none">
          <View style={styles.itemFixed}>
            <BankBuilding
              width={scaleWidth(14)}
              height={scaleWidth(14)}
              color={Colors.primaryColor}
            />
            <Text style={styles.breadcrumbText} numberOfLines={1} ellipsizeMode="tail">
              {bankLabel}
            </Text>
          </View>

          <RightChevron
            height={scaleHeight(12)}
            width={scaleWidth(12)}
            style={styles.chev}
          />

          <View style={styles.itemFixed}>
            <Folder
              width={scaleWidth(14)}
              height={scaleWidth(14)}
              color={Colors.primaryColor}
            />
            <Text style={styles.breadcrumbText} numberOfLines={1} ellipsizeMode="tail">
              {productLabel}
            </Text>
          </View>

          <RightChevron
            height={scaleHeight(12)}
            width={scaleWidth(12)}
            style={styles.chev}
          />

          <View style={styles.itemGrow}>
            <File
              width={scaleWidth(14)}
              height={scaleWidth(14)}
              color={Colors.primaryColor}
            />
            <Text style={styles.breadcrumbTextGrow} numberOfLines={1} ellipsizeMode="tail">
              {selection.programName}
            </Text>
          </View>

          {/* Visual affordance that this is clickable */}
          <View style={styles.changePill}>
            <EditIcon />
            <Text style={styles.changeText}>Change</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  breadcrumbContainer: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  breadcrumbButton: {
    alignSelf: 'stretch',
    backgroundColor: '#FFF9F9',
    borderWidth: 1,
    borderColor: '#FFD9D9',
    borderRadius: scaleWidth(10),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: scaleWidth(4),
    width: '100%',
  },
  itemFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    flexShrink: 0,
  },
  itemGrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  chev: {
    opacity: 0.8,
  },
  breadcrumbText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  breadcrumbTextGrow: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    minWidth: 0,
    flexShrink: 1,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(999),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD9D9',
    marginLeft: scaleWidth(2),
    flexShrink: 0,
  },
  changeText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
});
