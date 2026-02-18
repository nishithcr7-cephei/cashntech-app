import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Plus} from '@assets/Icons';

type Props = {
  dealerListTitle: string;
  invoiceCount: number;
  isDealerMaker: boolean;
  isAnchorMaker: boolean;
  isAnchorChecker: boolean;
  isDealerChecker: boolean;
  filteredDataLength: number;
  searchText: string;
  setSearchText: (v: string) => void;
  onOpenFilterModal: () => void;
  navigation: any;
  allSelectedOnScreen: boolean;
  onToggleSelectAllVisible: () => void;
  selectedInvoiceIdsLength: number;
  onOpenSendForApprovalModal: () => void;
};

export const InvoiceDetailsControls: React.FC<Props> = ({
  dealerListTitle,
  invoiceCount,
  isDealerMaker,
  isAnchorMaker,
  isAnchorChecker,
   isDealerChecker,
  filteredDataLength,
  searchText,
  setSearchText,
  onOpenFilterModal,
  navigation,
  allSelectedOnScreen,
  onToggleSelectAllVisible,
  selectedInvoiceIdsLength,
  onOpenSendForApprovalModal,
}) => {
  return (
    <View style={styles.controlsSection}>
      <View style={styles.topRow}>
        <View style={styles.dealersBadgeContainer}>
          <Text style={styles.dealersLabel}>{dealerListTitle}</Text>
          <View style={styles.dealersBadge}>
            <Text style={styles.dealersBadgeText}>{invoiceCount}</Text>
          </View>
        </View>
      </View>

      {(isDealerChecker || isAnchorChecker) && filteredDataLength > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dmSelectAllRow}
          onPress={onToggleSelectAllVisible}>
          <View
            style={[
              styles.checkboxBox,
              allSelectedOnScreen && styles.checkboxBoxSelected,
            ]}>
            {allSelectedOnScreen && (
              <Text style={styles.checkboxTick}>✓</Text>
            )}
          </View>
          <Text style={styles.dmSelectAllText}>
            {allSelectedOnScreen ? 'Unselect all' : 'Select all'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchFilterRow}>
        <View style={styles.searchContainer}>
          <Search width={scaleWidth(18)} height={scaleHeight(18)} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Entity"
            placeholderTextColor={Colors.graybase}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onOpenFilterModal}>
          <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.primaryActionsRow}>
        {isAnchorMaker && (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonHalf]}
              onPress={() => navigation.navigate('UploadInvoiceList' as never)}>
              <View style={styles.buttonIconContainer}>
                <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
              </View>
              <Text style={styles.primaryButtonText}>Upload Invoice List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonHalf]}
              onPress={() => navigation.navigate('CreateInvoice' as never)}>
              <View style={styles.buttonIconContainer}>
                <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
              </View>
              <Text style={styles.primaryButtonText}>Create Invoice</Text>
            </TouchableOpacity>
          </>
        )}
        {isDealerMaker && (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonHalf]}
              onPress={() => navigation.navigate('UploadInvoiceList' as never)}>
              <View style={styles.buttonIconContainer}>
                <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
              </View>
              <Text style={styles.primaryButtonText}>Upload Invoice List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonHalf]}
              onPress={() => navigation.navigate('CreateInvoice' as never)}>
              <View style={styles.buttonIconContainer}>
                <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
              </View>
              <Text style={styles.primaryButtonText}>Create Invoice</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {(isDealerChecker || isAnchorChecker) && selectedInvoiceIdsLength > 0 && (
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={onOpenSendForApprovalModal}>
          <Text style={styles.proceedButtonText}>
            Proceed ({selectedInvoiceIdsLength} selected)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controlsSection: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(16),
    gap: scaleHeight(16),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  dealersBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  dealersLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  dealersBadge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  dealersBadgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  dmSelectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(2),
  },
  dmSelectAllText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginLeft: scaleWidth(8),
  },
  checkboxBox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(12),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginTop: scaleHeight(12),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
    justifyContent: 'center',
    minWidth: scaleWidth(100),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(4),
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(10),
    gap: scaleWidth(6),
  },
  primaryButtonHalf: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(10),
  },
  buttonIconContainer: {
    width: scaleWidth(18),
    height: scaleHeight(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
  },
  proceedButton: {
    backgroundColor: Colors.primaryColor,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(10),
    alignItems: 'center',
    marginTop: scaleHeight(8),
  },
  proceedButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
});
