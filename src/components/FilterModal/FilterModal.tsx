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
import MonthYearFilter from '../MonthYearFilter/MonthYearFilter';

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply?: (selectedFilter: Record<string, string[]>) => void;
  filterData: Record<string, string[]>;
  appliedFilters: Record<string, string[]>;
};

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  filterData,
  appliedFilters,
}) => {
  const [selectedMenu, setSelectedMenu] = useState<string>(
    Object.keys(filterData)[0],
  );
  const [selectedFilters, setSelectedFilters] =
    useState<Record<string, string[]>>(appliedFilters);

  const clearFilters = () => {
    setSelectedFilters({});
    setSelectedMenu(Object.keys(filterData)[0]);
  };

  const handleApply = () => {
    onApply && onApply(selectedFilters);
    onClose();
  };

  const toggleOption = (menu: string, option: string) => {
    setSelectedFilters(prev => {
      const currentOptions = prev[menu] ?? [];
      if (currentOptions.includes(option)) {
        return {...prev, [menu]: currentOptions.filter(o => o !== option)};
      } else {
        return {...prev, [menu]: [...currentOptions, option]};
      }
    });
  };

  const toggleMenu = (menu: string) => {
    setSelectedMenu(menu);
  };

  const renderOptionItem = ({item}: {item: string}) => {
    const isSelected = selectedFilters[selectedMenu]?.includes(item);
    return (
      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => toggleOption(selectedMenu, item)}>
        <View style={[styles.checkbox, isSelected && styles.checked]}>
          {isSelected && <Tick width={14} height={14} stroke={Colors.white} />}
        </View>
        <Text style={styles.optionText}>{item}</Text>
      </TouchableOpacity>
    );
  };

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
            <LeftChevron width={14} height={14} />
            <Text style={styles.headerTitle}>Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.sideMenu}>
            {Object.keys(filterData).map((menu, index) => {
              const isSelected = selectedMenu === menu;
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
            {selectedMenu === 'Month/Year' ? (
              <MonthYearFilter
                selectedMonths={selectedFilters['Month/Year'] || []}
                onSelectionChange={(months) => {
                  setSelectedFilters(prev => ({
                    ...prev,
                    'Month/Year': months
                  }));
                }}
              />
            ) : (
              <FlatList
                data={filterData[selectedMenu]}
                keyExtractor={item => item}
                renderItem={renderOptionItem}
              />
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
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
    marginLeft: scaleWidth(12),
  },
  clearText: {
    color: Colors.gray400,
    textDecorationLine: 'underline',
    fontWeight: fontWeight.SemiBold,
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
    borderColor: Colors.primaryColor,
  },
  optionText: {
    fontSize: scaleFont(15),
    marginLeft: scaleWidth(10),
  },
});
