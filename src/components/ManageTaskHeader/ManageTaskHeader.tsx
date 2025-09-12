import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@constants/Colors';
import { Filter, Search } from '@assets/Icons';
import { scaleFont, scaleHeight, scaleWidth } from '@utils/Scale';

interface ManageTaskHeaderProps {
  taskCount: number;
  searchText: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
}

const ManageTaskHeader: React.FC<ManageTaskHeaderProps> = ({
  taskCount,
  searchText,
  onSearchChange,
  onFilterPress,
}) => {
  return (
    <>
      <View style={styles.subContainer}>
        <Text style={styles.Subheader}>Assigned Task List</Text>
      </View>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Assigned Task</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{taskCount}</Text>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Search height={12} width={12} />
          <TextInput
            style={styles.input}
            placeholder="Search by Firm name"
            placeholderTextColor={Colors.balancedGray}
            value={searchText}
            onChangeText={onSearchChange}
          />
        </View>
        <TouchableOpacity onPress={onFilterPress}>
          <View style={styles.filterBox}>
            <Filter height={12} width={12} />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  subContainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: '600',
    backgroundColor: Colors.LimeGray,
  },
  headerRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: scaleFont(16), fontWeight: '600', color: Colors.darkblack },
  badge: { backgroundColor: Colors.lightPink, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: Colors.SteelGray },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    height: scaleHeight(36),
    marginLeft: 5,
    marginTop: 2,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
  },
  input: { marginLeft: 8, fontSize: scaleFont(12), paddingTop: scaleHeight(8), textAlignVertical: 'center' },
  filterBox: {
    width: scaleWidth(32),
    height: scaleHeight(30),
    backgroundColor: Colors.primaryColor,
    marginLeft: scaleWidth(8),
    padding: 10,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ManageTaskHeader;
