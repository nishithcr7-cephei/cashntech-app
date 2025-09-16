import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { scaleFont, scaleHeight, scaleWidth } from '@utils/Scale';
import { Colors } from '@constants/index';

interface MonthYearFilterProps {
  selectedMonths: string[]; // Format: ["2025-08", "2025-09"]
  onSelectionChange: (months: string[]) => void;
}

const MonthYearFilter: React.FC<MonthYearFilterProps> = ({
  selectedMonths,
  onSelectionChange,
}) => {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const toggleMonth = (monthIndex: number) => {
    const monthYear = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    if (selectedMonths.includes(monthYear)) {
      onSelectionChange(selectedMonths.filter(m => m !== monthYear));
    } else {
      onSelectionChange([...selectedMonths, monthYear]);
    }
  };

  const isMonthSelected = (monthIndex: number) => {
    const monthYear = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    return selectedMonths.includes(monthYear);
  };

  const renderYearItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.yearItem,
        item === selectedYear && styles.selectedYearItem
      ]}
      onPress={() => {
        setSelectedYear(item);
        setShowYearPicker(false);
      }}
    >
      <Text style={[
        styles.yearText,
        item === selectedYear && styles.selectedYearText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderMonthItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.monthItem,
        isMonthSelected(index) && styles.selectedMonthItem
      ]}
      onPress={() => toggleMonth(index)}
    >
      <Text style={[
        styles.monthText,
        isMonthSelected(index) && styles.selectedMonthText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Year Selection */}
      <View style={styles.yearSection}>
        <TouchableOpacity
          style={styles.yearSelector}
          onPress={() => setShowYearPicker(true)}
        >
          <Text style={styles.yearDisplay}>{selectedYear}</Text>
          <View style={styles.calendarIcon}>
            <Text style={styles.calendarIconText}>📅</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Month Selection */}
      <Text style={styles.monthLabel}>Select Months for {selectedYear}</Text>
      
      <View style={styles.monthGrid}>
        {months.map((month, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.monthItem,
              isMonthSelected(index) && styles.selectedMonthItem
            ]}
            onPress={() => toggleMonth(index)}
          >
            <Text style={[
              styles.monthText,
              isMonthSelected(index) && styles.selectedMonthText
            ]}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.yearPickerContainer}>
            <View style={styles.yearPickerHeader}>
              <Text style={styles.yearPickerTitle}>Select Year</Text>
              <TouchableOpacity
                onPress={() => setShowYearPicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={years}
              renderItem={renderYearItem}
              keyExtractor={(item) => item.toString()}
              numColumns={4}
              contentContainerStyle={styles.yearGrid}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: scaleWidth(16),
  },
  yearSection: {
    marginBottom: scaleHeight(16),
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scaleWidth(8),
    backgroundColor: '#fff',
  },
  yearDisplay: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#333333',
  },
  calendarIcon: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconText: {
    fontSize: scaleFont(14),
  },
  monthLabel: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: '#666666',
    marginBottom: scaleHeight(12),
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '30%',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(8),
    marginBottom: scaleHeight(8),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectedMonthItem: {
    backgroundColor: '#FFE9E9', // Light red background like in the image
    borderColor: Colors.primaryColor,
  },
  monthText: {
    fontSize: scaleFont(13),
    color: '#333333',
    textAlign: 'center',
  },
  selectedMonthText: {
    color: Colors.primaryColor,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    width: scaleWidth(300),
    maxHeight: scaleHeight(400),
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
    paddingBottom: scaleHeight(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EC',
  },
  yearPickerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(16),
    color: '#666666',
  },
  yearGrid: {
    paddingVertical: scaleHeight(8),
  },
  yearItem: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(8),
    margin: scaleWidth(2),
    borderRadius: scaleWidth(6),
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  selectedYearItem: {
    backgroundColor: '#FFF2E6', // Light brown background like in the image
    borderColor: Colors.primaryColor,
  },
  yearText: {
    fontSize: scaleFont(14),
    color: '#333333',
  },
  selectedYearText: {
    color: Colors.primaryColor,
    fontWeight: '600',
  },
});

export default MonthYearFilter;
