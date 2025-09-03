import {
  StyleSheet,
  Text,
  Modal,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import React, {useState} from 'react';
import {LeftChevron, Tick} from '@assets/Icons';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';
import {Colors} from '@constants/index';

type FilterModelProps = {
  visible: boolean;
  onClose: () => void;
};

const Data: Record<string, string[]> = {
  City: ['Mumbai', 'Delhi', 'Bangalore'],
  Sector: ['FMCG', 'Pharma', 'Manufacturing'],
  Source: ['Market Knowledge', 'Customer Reference', 'Telecalling'],
};

const sideMenu = ['City', 'Sector', 'Source'];

export const FilterModel: React.FC<FilterModelProps> = ({visible, onClose}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<string>(sideMenu[0]);

  const toggleMenu = (menu: string) => {
    setSelectedMenus(menu);
    setSelectedOption(null);
  };

  const renderOptionItem = ({item}: {item: string}) => (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={() => setSelectedOption(prev => (prev === item ? null : item))}>
      <View style={styles.checkbox}>
        {selectedOption === item && <Tick width={14} height={14} />}
      </View>
      <Text style={styles.optionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <LeftChevron width={12} height={12} />
            <Text style={styles.headerTitle}>Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.sideMenu}>
            {sideMenu.map((menu, index) => {
              const isSelected = selectedMenus.includes(menu);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => toggleMenu(menu)}>
                  <Text
                    style={[styles.menuText, isSelected && styles.activeMenu]}>
                    {menu}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.optionsContainer}>
            <FlatList
              data={Data[selectedMenus] || []}
              keyExtractor={item => item}
              renderItem={renderOptionItem}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => {
              setSelectedOption(null);
              setSelectedMenus(sideMenu[0]);
            }}>
            <Text style={styles.clearText}>Clear Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: scaleWidth(16),
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(8),
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: fontWeight.Bold,
    marginLeft: scaleWidth(8),
  },
  clearText: {
    color: Colors.lightGray,
    fontSize: scaleFont(14),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sideMenu: {
    width: scaleWidth(130),
    borderRightWidth: 0.5,
    borderRightColor: Colors.lightGray,
  },
  menuItem: {
    padding: scaleWidth(14),
  },
  menuText: {
    fontSize: scaleFont(14),
    color: Colors.gray500,
  },
  activeMenu: {
    color: Colors.primaryColor,
    fontWeight: fontWeight.SemiBold,
  },
  optionsContainer: {
    flex: 1,
    padding: scaleWidth(16),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scaleWidth(16),
    borderTopWidth: 0.5,
    borderTopColor: Colors.lightGray,
    gap: scaleWidth(12),
  },
  footerText: {
    fontSize: scaleFont(14),
    color: Colors.balancedGray,
  },
  applyBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(4),
  },
  applyText: {
    color: Colors.white,
    fontWeight: fontWeight.SemiBold,
    fontSize: scaleFont(15),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(14),
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(3),
  },
  checked: {
    backgroundColor: Colors.primaryColor,
  },
  optionText: {
    fontSize: scaleFont(15),
    marginLeft: scaleWidth(10),
  },
});
