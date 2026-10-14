import React from 'react';
import {ScrollView, View, TouchableOpacity, Text} from 'react-native';
import {styles} from '../InvoiceDashboard.styles';
import type {ProductTabType} from '../types';

interface ProductTabsProps {
  activeTab: ProductTabType;
  onTabChange: (tab: ProductTabType) => void;
}

const PRODUCT_TABS: {id: ProductTabType; label: string}[] = [
  {id: 'all_product', label: 'All Product'},
  {id: 'dealer_finance', label: 'Dealer Finance'},
  {id: 'vendor_finance', label: 'Vendor Finance'},
  {id: 'pid', label: 'PID'},
  {id: 'sid', label: 'SID'},
];

export const ProductTabs: React.FC<ProductTabsProps> = ({activeTab, onTabChange}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.productTabsScroll}>
      <View style={styles.productTabsRow}>
        {PRODUCT_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.productTabBtn,
              activeTab === tab.id && styles.productTabBtnActive,
            ]}
            onPress={() => onTabChange(tab.id)}>
            <Text
              style={[
                styles.productTabText,
                activeTab === tab.id && styles.productTabTextActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
