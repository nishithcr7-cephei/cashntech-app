import * as React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Plus} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import Toast from 'react-native-toast-message';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {useSelector} from 'react-redux';
import {selectPermissionsLoading} from '@store/permissions';
import {shouldShowCreateInvoice} from '@utils/permissionHelpers';
import {selectEffectiveProductCode} from '@store/product/product.selectors';
import {PRODUCT_CODES} from '@store/product/product.types';

type Props = {
  dealerListTitle: string;
  invoiceCount: number;
  isDealerMaker: boolean;
  isAnchorMaker: boolean;
  isAnchorChecker: boolean;
  isDealerChecker: boolean;
  isAnchorAllAccess?: boolean;
  isDealerAllAccess?: boolean;
  isCashnTechUser?: boolean;
  filteredDataLength: number;
  searchText: string;
  setSearchText: (v: string) => void;
  onOpenFilterModal: () => void;
  navigation: any;
  allSelectedOnScreen: boolean;
  onToggleSelectAllVisible: () => void;
  selectedInvoiceIdsLength: number;
  onOpenSendForApprovalModal: () => void;
  onCreateInvoicePress?: () => void;
  isCreateInvoiceEnabled?: boolean;
  createInvoiceDisabledReason?: string | null;
  user?: any;
  actionRequiredCount?: number;
  pendingCount?: number;
  draftCount?: number;
  onBulkAction?: (action: 'Verify' | 'Reject' | 'On Hold') => void;
  canEdit?: boolean;
  canImport?: boolean;
  onRefresh?: () => void;
  listRefreshing?: boolean;
};

export const InvoiceDetailsControls: React.FC<Props> = ({
  dealerListTitle,
  invoiceCount,
  isDealerMaker,
  isAnchorMaker,
  isAnchorChecker,
  isDealerChecker,
  isAnchorAllAccess = false,
  isDealerAllAccess = false,
  isCashnTechUser = false,
  filteredDataLength,
  searchText,
  setSearchText,
  onOpenFilterModal,
  navigation,
  allSelectedOnScreen,
  onToggleSelectAllVisible,
  selectedInvoiceIdsLength,
  onOpenSendForApprovalModal,
  onCreateInvoicePress,
  isCreateInvoiceEnabled = true,
  createInvoiceDisabledReason,
  user,
  actionRequiredCount = 0,
  pendingCount = 0,
  draftCount = 0,
  onBulkAction,
  canEdit = false,
  canImport = false,
  onRefresh,
  listRefreshing = false,
}) => {
  const [showSearchHelp, setShowSearchHelp] = React.useState(false);
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const effectiveProductCode = useSelector(selectEffectiveProductCode);
  const createPermissionKey =
    effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE
      ? PERMISSIONS.VF_CREATE_INVOICE
      : PERMISSIONS.DF_CREATE_INVOICE;
  const canCreateInvoice =
    useHasPermission(createPermissionKey) ||
    useHasPermission(PERMISSIONS.INVOICE_LIST_CREATE);
  const canUploadInvoice = useHasPermission(PERMISSIONS.INVOICE_LIST_IMPORT);
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canVerify = useHasPermission(PERMISSIONS.INVOICE_LIST_ADMIN_VERIFICATION);
  
  const hasFunctionalPermission = canApprove || canReject || canVerify;

  // Composite Role-based visibility check for "Create Invoice"
  const showCreateButton = shouldShowCreateInvoice(user, canCreateInvoice);

  const onPressCreateInvoice = () => {
    if (!isCreateInvoiceEnabled) {
      Toast.show({
        type: 'info',
        text1: createInvoiceDisabledReason || 'Select a program to create an invoice',
      });
      return;
    }
    const handler =
      onCreateInvoicePress ??
      (() => navigation.navigate('CreateInvoice' as never));
    handler();
  };

  return (
    <View style={styles.controlsSection}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.pendingCard]}>
          <View style={styles.pendingDotSmall} />
          <Text style={[styles.summaryCount, styles.pendingText]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>PENDING FOR APPROVAL</Text>
        </View>
        {draftCount > 0 && (isAnchorMaker || isDealerMaker || isAnchorAllAccess || isDealerAllAccess) && canImport && (
          <View style={[styles.summaryCard, styles.draftCard]}>
            <View style={styles.draftDotSmall} />
            <Text style={[styles.summaryCount, styles.draftText]}>{draftCount}</Text>
            <Text style={styles.summaryLabel}>DRAFT</Text>
          </View>
        )}
        {actionRequiredCount > 0 && (isAnchorMaker || isDealerMaker || isAnchorAllAccess || isDealerAllAccess) && canEdit && (
          <View style={[styles.summaryCard, styles.actionRequiredCard]}>
            <View style={styles.actionDotSmall} />
            <Text style={[styles.summaryCount, styles.actionRequiredText]}>{actionRequiredCount}</Text>
            <Text style={styles.summaryLabel}>ACTION REQUIRED</Text>
          </View>
        )}
      </View>


      {/* Search moved below */}

      {/* Legend replaced by summary cards above */}

      <View style={styles.selectAllCreateRow}>
        <View style={styles.dmSelectAllWrapper}>
          {(isDealerChecker || isAnchorChecker || isCashnTechUser || isAnchorAllAccess || isDealerAllAccess) && hasFunctionalPermission && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.dmSelectAllRow,
                {opacity: filteredDataLength > 0 ? 1 : 0},
              ]}
              disabled={filteredDataLength === 0}
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
              <Text style={styles.dmSelectAllText}>Select all</Text>
              {(isCashnTechUser || isAnchorChecker || isDealerChecker || isAnchorAllAccess || isDealerAllAccess) && (
                <View style={styles.bulkBadge}>
                  <Text style={styles.bulkBadgeText}>Bulk Actions</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.primaryActionsRow}>
          {(isAnchorMaker || isCashnTechUser || isAnchorAllAccess) && showCreateButton && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.primaryButtonSingle,
                (!isCreateInvoiceEnabled || permissionsLoading) && styles.primaryButtonDisabled,
              ]}
              disabled={permissionsLoading}
              onPress={onPressCreateInvoice}>
              <View style={styles.buttonIconContainer}>
                <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
              </View>
              <Text style={styles.primaryButtonText}>Create Invoice</Text>
            </TouchableOpacity>
          )}
          {(isDealerMaker || isDealerAllAccess) && !isCashnTechUser && (
            <>
              {showCreateButton && (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.primaryButtonSingle,
                    (!isCreateInvoiceEnabled || permissionsLoading) && styles.primaryButtonDisabled,
                  ]}
                  disabled={permissionsLoading}
                  onPress={onPressCreateInvoice}>
                  <View style={styles.buttonIconContainer}>
                    <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
                  </View>
                  <Text style={styles.primaryButtonText}>Create Invoice</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.searchFilterRow}>
        <View style={styles.searchContainer}>
          <Search width={scaleWidth(18)} height={scaleHeight(18)} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Invoices"
            placeholderTextColor={Colors.graybase}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            multiline={false}
            numberOfLines={1}
            accessibilityLabel="Search invoices"
            accessibilityHint="Search by invoice number, program, or party. Tap the info button for details."
          />
          <TouchableOpacity
            onPress={() => setShowSearchHelp(true)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.7}
            accessibilityLabel="Search help"
            accessibilityRole="button">
            <FontAwesome6
              name="circle-info"
              iconStyle="solid"
              size={17}
              color={Colors.graybase}
            />
          </TouchableOpacity>
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchText('')}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              activeOpacity={0.7}>
              <FontAwesome6 name="circle-xmark" iconStyle="solid" size={18} color={Colors.graybase} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            listRefreshing && styles.refreshButtonDisabled,
          ]}
          onPress={onRefresh}
          disabled={!onRefresh || listRefreshing}
          activeOpacity={0.8}
          accessibilityLabel="Refresh invoice list"
          accessibilityRole="button">
          {listRefreshing ? (
            <ActivityIndicator size="small" color={Colors.primaryColor} />
          ) : (
            <FontAwesome6
              name="arrow-rotate-right"
              iconStyle="solid"
              size={18}
              color={Colors.primaryColor}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onOpenFilterModal}>
          <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={showSearchHelp}
        animationType="fade"
        onRequestClose={() => setShowSearchHelp(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSearchHelp(false)}>
          <View style={styles.searchHelpOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.searchHelpCard}>
                <View style={styles.searchHelpHeader}>
                  <Text style={styles.searchHelpTitle}>Search help</Text>
                  <TouchableOpacity
                    onPress={() => setShowSearchHelp(false)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    accessibilityLabel="Close search help">
                    <FontAwesome6
                      name="circle-xmark"
                      iconStyle="solid"
                      size={22}
                      color={Colors.graybase}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.searchHelpText}>
                  Search by Invoice, Program, or Party.
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderLabel}>
          {dealerListTitle}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{invoiceCount}</Text>
        </View>
      </View>


      {(isDealerChecker || isAnchorChecker || isCashnTechUser || isAnchorAllAccess || isDealerAllAccess) && 
        hasFunctionalPermission && 
        selectedInvoiceIdsLength > 0 && (
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
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(8),
    gap: scaleHeight(8),
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
  blueDotLegendRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: scaleHeight(8),
    paddingRight: scaleWidth(2),
  },
  blueDotLegendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    maxWidth: '92%',
  },
  blueDotLegendText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    flexShrink: 1,
    textAlign: 'right',
  },
  pendingDot: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
    backgroundColor: Colors.tertiaryBlue,
  },
  legendStackRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: scaleHeight(8),
    gap: scaleWidth(12),
    paddingRight: scaleWidth(2),
  },
  /* Legend styles removed */
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
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E6E4DC',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    minHeight: scaleHeight(44),
    gap: scaleWidth(6),
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    padding: 0,
    margin: 0,
    height: scaleHeight(22),
    lineHeight: scaleHeight(18),
    ...(Platform.OS === 'android'
      ? {includeFontPadding: false, textAlignVertical: 'center' as const}
      : {}),
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginTop: scaleHeight(4),
  },
  refreshButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E6E4DC',
    width: scaleWidth(44),
    height: scaleWidth(44),
    borderRadius: scaleWidth(12),
    flexShrink: 0,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(4),
    justifyContent: 'center',
    minWidth: scaleWidth(76),
    flexShrink: 0,
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  searchHelpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  searchHelpCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
  },
  searchHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  searchHelpTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  searchHelpText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    lineHeight: scaleHeight(20),
  },
  primaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  selectAllCreateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(4),
    minHeight: scaleHeight(44), // Lock height to prevent shift
  },
  dmSelectAllWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: scaleHeight(32),
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
  primaryButtonSingle: {
    marginLeft: 'auto',
    paddingHorizontal: scaleWidth(18),
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  disabledHintContainer: {
    marginTop: scaleHeight(4),
  },
  disabledHintText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
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
  bulkBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(4),
    marginLeft: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#C3DAFE',
  },
  bulkBadgeText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyBold,
    color: '#4338CA',
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingBottom: scaleHeight(4),
    gap: scaleWidth(8),
  },
  summaryCard: {
    flex: 1,
    minHeight: scaleHeight(50),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    elevation: 0,
    shadowOpacity: 0,
  },
  pendingCard: {
    borderColor: '#E2E8F0',
  },
  draftCard: {
    borderColor: '#E2E8F0',
  },
  totalCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E6E4DC',
  },
  summaryCount: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroyBold,
    lineHeight: scaleHeight(22),
  },
  pendingText: {
    color: Colors.tertiaryBlue,
  },
  draftText: {
    color: '#F59E0B',
  },
  totalText: {
    color: '#17160F',
  },
  actionRequiredCard: {
    borderColor: '#E2E8F0',
  },
  actionRequiredText: {
    color: Colors.red,
  },
  summaryLabel: {
    fontSize: scaleFont(9),
    fontFamily: Fonts.GilroySemiBold,
    textTransform: 'uppercase',
    color: '#64748B',
    marginTop: scaleHeight(2),
    textAlign: 'center',
    paddingHorizontal: scaleWidth(4),
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(4),
    gap: scaleWidth(8),
  },
  listHeaderLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  countBadge: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    minWidth: scaleWidth(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  pendingDotSmall: {
    width: scaleWidth(6),
    height: scaleWidth(6),
    borderRadius: scaleWidth(3),
    backgroundColor: Colors.tertiaryBlue,
    position: 'absolute',
    top: scaleHeight(6),
    right: scaleWidth(6),
  },
  draftDotSmall: {
    width: scaleWidth(6),
    height: scaleWidth(6),
    borderRadius: scaleWidth(3),
    backgroundColor: '#F59E0B',
    position: 'absolute',
    top: scaleHeight(6),
    right: scaleWidth(6),
  },
  actionDotSmall: {
    width: scaleWidth(6),
    height: scaleWidth(6),
    borderRadius: scaleWidth(3),
    backgroundColor: Colors.red,
    position: 'absolute',
    top: scaleHeight(6),
    right: scaleWidth(6),
  },
});

