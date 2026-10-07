import React, {useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, TouchableOpacity, View} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import type {ConsolidatedSearchField} from '@store/consolidatedInvoice/consolidatedInvoice.types';

type FieldOption = {
  value: ConsolidatedSearchField;
  label: string;
  shortLabel: string;
};

type Props = {
  options: FieldOption[];
  value: FieldOption;
  onChange: (field: ConsolidatedSearchField) => void;
};

type Anchor = {x: number; y: number; height: number};

/** Compact prefix inside the search box; the menu opens just below it. */
export const SearchFieldPicker: React.FC<Props> = ({options, value, onChange}) => {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, _width, height) => {
      setAnchor({x, y, height});
    });
  };

  const close = () => setAnchor(null);

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        style={styles.trigger}
        activeOpacity={0.7}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Search field: ${value.label}. Tap to change.`}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {value.shortLabel}
        </Text>
        <FontAwesome6
          name="caret-down"
          iconStyle="solid"
          size={scaleFont(11)}
          color={Colors.darkblack}
        />
      </TouchableOpacity>

      <Modal
        visible={!!anchor}
        transparent
        animationType="fade"
        onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          {anchor ? (
            <View
              style={[
                styles.menu,
                {top: anchor.y + anchor.height + scaleHeight(6), left: anchor.x},
              ]}>
              {options.map(option => {
                const isOn = option.value === value.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.menuItem, isOn && styles.menuItemOn]}
                    activeOpacity={0.7}
                    onPress={() => {
                      close();
                      onChange(option.value);
                    }}
                    accessibilityRole="menuitem"
                    accessibilityState={{selected: isOn}}>
                    <Text style={[styles.menuText, isOn && styles.menuTextOn]}>
                      {option.label}
                    </Text>
                    {isOn ? (
                      <FontAwesome6
                        name="check"
                        iconStyle="solid"
                        size={scaleFont(11)}
                        color={Colors.primaryColor}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    height: '100%',
    paddingLeft: scaleWidth(12),
    paddingRight: scaleWidth(10),
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    maxWidth: scaleWidth(110),
  },
  triggerText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: scaleWidth(170),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(10),
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
  },
  menuItemOn: {
    backgroundColor: '#FFF5F5',
  },
  menuText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  menuTextOn: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
});
