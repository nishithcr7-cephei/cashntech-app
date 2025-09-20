import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {scaleWidth, scaleHeight, scaleFont} from '@utils/Scale';
import Colors from '@constants/Colors';
import FontWeight from '@constants/FontWeight';

export interface TabItem {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({tabs, activeTab, onTabPress}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.activeTabLabel,
              ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LimeGray,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(16),
  },
  tab: {
    flex: 1,
    paddingVertical: scaleHeight(16),
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.Medium,
    color: Colors.graybase,
    textAlign: 'center',
  },
  activeTabLabel: {
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primaryColor,
  },
});
