import * as React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
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
import {useDispatch, useSelector} from 'react-redux';
import {selectPermissionsLoading} from '@store/permissions';
import {navigateToCreateInvoice} from '@store/ui';
import {shouldShowCreateInvoice} from '@utils/permissionHelpers';
import {selectEffectiveProductCode} from '@store/product/product.selectors';
import {
  PRODUCT_CODES,
  PRODUCT_DISPLAY_NAMES,
  PRODUCT_SHORT_LABELS,
} from '@store/product/product.types';

type SummaryFocus =
  | 'all'
  | 'pending'
  | 'pendingNoa'
  | 'draft'
  | 'actionRequired';

type Props = {
  dealerListTitle: string;
  /** Selected program name (or "All Program"), shown above the list title. */
  programTitle?: string;
  invoiceCount: number;
  listHeaderTitle?: string;
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
  /** SID Notice of Assignment turn count */
  pendingNoaCount?: number;
  draftCount?: number;
  summaryFocus?: SummaryFocus;
  onSummaryFocusChange?: (focus: SummaryFocus) => void;
  summaryFocusHint?: string | null;
  onBulkAction?: (action: 'Verify' | 'Reject' | 'On Hold') => void;
  canEdit?: boolean;
  canImport?: boolean;
  /** Show Pending NOA chip when count > 0 (maker + permission). */
  canNoticeOfAssignment?: boolean;
  onRefresh?: () => void;
  listRefreshing?: boolean;
  /** Search + Filters only when the list has at least one invoice. */
  showSearchAndFilter?: boolean;
  /** Program title + list heading rendered elsewhere (scrolling list header). */
  hideListTitle?: boolean;
};

type ListTitleProps = {
  title: string;
  count: number;
};

export const InvoiceListTitle: React.FC<ListTitleProps> = ({title, count}) => (
  <View style={styles.listHeader}>
    <Text style={styles.listHeaderLabel}>{title}</Text>
    <View style={styles.countBadge}>
      <Text style={styles.countBadgeText}>{count}</Text>
    </View>
  </View>
);

export const InvoiceDetailsControls: React.FC<Props> = ({
  dealerListTitle,
  programTitle,
  invoiceCount,
  listHeaderTitle,
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
  pendingNoaCount = 0,
  draftCount = 0,
  summaryFocus = 'all',
  onSummaryFocusChange,
  summaryFocusHint = null,
  onBulkAction,
  canEdit = false,
  canImport = false,
  canNoticeOfAssignment = false,
  onRefresh,
  listRefreshing = false,
  showSearchAndFilter = true,
  hideListTitle = false,
}) => {
  const dispatch = useDispatch();
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
  const canBulkActions = useHasPermission(PERMISSIONS.INVOICE_LIST_BULK_ACTIONS);
  const canUploadVerify = useHasPermission(PERMISSIONS.INVOICE_LIST_UPLOAD_VERIFY);

  const hasFunctionalPermission = canApprove || canReject || canVerify;
  const isVendorFinance =
    effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE;
  const isPartyBulkRole =
    isDealerChecker ||
    isAnchorChecker ||
    isAnchorAllAccess ||
    isDealerAllAccess ||
    (isAnchorMaker && isVendorFinance);
  const showBulkSelectUi =
    (isCashnTechUser && canUploadVerify) ||
    (isPartyBulkRole &&
      canBulkActions &&
      (canApprove || canReject));

  // Composite Role-based visibility check for "Create Invoice"
  const showCreateButton = shouldShowCreateInvoice(user, canCreateInvoice);
  const isSidProduct =
    effectiveProductCode === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING;
  const isMakerChipRole =
    isAnchorMaker ||
    isDealerMaker ||
    isAnchorAllAccess ||
    isDealerAllAccess;
  /** SID maker strip matches web: Draft · Pending NOA · Action Required (incl. zeros). */
  const isSidMakerSummary = isSidProduct && !isCashnTechUser && isMakerChipRole;

  const showDraftChip = isSidMakerSummary
    ? canImport
    : draftCount > 0 && isMakerChipRole && canImport;
  const showActionChip = isSidMakerSummary
    ? canEdit
    : actionRequiredCount > 0 && isMakerChipRole && canEdit;
  const showPendingNoaChip = isSidMakerSummary
    ? canNoticeOfAssignment
    : pendingNoaCount > 0 &&
      !isCashnTechUser &&
      isMakerChipRole &&
      canNoticeOfAssignment;
  /** Generic "Pending" = approval queue; web SID maker bar has no such chip (NOA replaces it). */
  const showPendingApprovalChip =
    pendingCount > 0 && !(isSidMakerSummary && canNoticeOfAssignment);

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
      (() =>
        navigateToCreateInvoice(dispatch, navigation, {freshCreate: true}));
    handler();
  };

  const renderActionChip = (
    key: SummaryFocus,
    label: string,
    count: number,
    tone: 'pending' | 'draft' | 'action',
  ) => {
    const active = summaryFocus === key;
    const toneStyle =
      tone === 'pending'
        ? styles.actionChipPending
        : tone === 'draft'
          ? styles.actionChipDraft
          : styles.actionChipRequired;
    const activeStyle =
      tone === 'pending'
        ? styles.actionChipPendingActive
        : tone === 'draft'
          ? styles.actionChipDraftActive
          : styles.actionChipRequiredActive;
    const countStyle =
      tone === 'pending'
        ? styles.actionCountPending
        : tone === 'draft'
          ? styles.actionCountDraft
          : styles.actionCountRequired;

    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.75}
        onPress={() => onSummaryFocusChange?.(key)}
        style={[styles.statChip, toneStyle, active && activeStyle]}
        accessibilityRole="button"
        accessibilityState={{selected: active}}
        accessibilityLabel={`${label}: ${count}. Tap to filter.`}>
        <Text style={[styles.actionChipCount, countStyle]}>{count}</Text>
        <Text style={[styles.actionChipLabel, countStyle]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const showCreateForAnchorOrCashn =
    (isAnchorMaker || isCashnTechUser || isAnchorAllAccess) && showCreateButton;
  const showCreateForDealer =
    (isDealerMaker || isDealerAllAccess) && !isCashnTechUser && showCreateButton;
  const showCreate = showCreateForAnchorOrCashn || showCreateForDealer;
  const createLabel =
    Dimensions.get('window').width < 360 ? 'Create' : 'Create Invoice';

  return (
    <View style={styles.controlsSection}>
      <View
        style={styles.contextStrip}
        accessibilityLabel={`${PRODUCT_DISPLAY_NAMES[effectiveProductCode]}${
          programTitle ? `, ${programTitle}` : ''
        }`}>
        <View style={styles.productChip}>
          <Text style={styles.productChipText}>
            {PRODUCT_SHORT_LABELS[effectiveProductCode]}
          </Text>
        </View>
        {!!programTitle && (
          <Text style={styles.contextProgramText} numberOfLines={1}>
            {programTitle}
          </Text>
        )}
      </View>
      {/* Row 1: chips (scroll) + Create */}
      <View style={styles.topControlsRow}>
        <View style={styles.chipsScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.summaryChipRow}
            style={styles.chipsScroll}>
            {isSidMakerSummary ? (
              <>
                {showDraftChip &&
                  renderActionChip('draft', 'Draft', draftCount, 'draft')}
                {showPendingNoaChip &&
                  renderActionChip(
                    'pendingNoa',
                    'Pending Notice of Assignment',
                    pendingNoaCount,
                    'pending',
                  )}
                {showActionChip &&
                  renderActionChip(
                    'actionRequired',
                    'Action Required',
                    actionRequiredCount,
                    'action',
                  )}
              </>
            ) : (
              <>
                {showPendingApprovalChip &&
                  renderActionChip(
                    'pending',
                    'Pending',
                    pendingCount,
                    'pending',
                  )}
                {showPendingNoaChip &&
                  renderActionChip(
                    'pendingNoa',
                    'Pending Notice of Assignment',
                    pendingNoaCount,
                    'pending',
                  )}
                {showDraftChip &&
                  renderActionChip('draft', 'Draft', draftCount, 'draft')}
                {showActionChip &&
                  renderActionChip(
                    'actionRequired',
                    'Action Required',
                    actionRequiredCount,
                    'action',
                  )}
              </>
            )}
          </ScrollView>
        </View>
        {showCreate && (
          <TouchableOpacity
            style={[
              styles.createBtnCompact,
              (!isCreateInvoiceEnabled || permissionsLoading) &&
                styles.primaryButtonDisabled,
            ]}
            disabled={permissionsLoading}
            onPress={onPressCreateInvoice}
            accessibilityRole="button"
            accessibilityLabel="Create Invoice">
            <View style={styles.buttonIconContainer}>
              <Plus width={scaleWidth(10)} height={scaleHeight(10)} />
            </View>
            <Text style={styles.createBtnText} numberOfLines={1}>
              {createLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {!!summaryFocusHint && (
        <Text style={styles.summaryFocusHint}>{summaryFocusHint}</Text>
      )}

      {/* Row 2: Search + Refresh + Filters */}
      {showSearchAndFilter ? (
        <View style={styles.searchFilterRow}>
          <View style={styles.searchContainer}>
            <Search width={scaleWidth(16)} height={scaleHeight(16)} />
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
                size={15}
                color={Colors.graybase}
              />
            </TouchableOpacity>
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                activeOpacity={0.7}>
                <FontAwesome6
                  name="circle-xmark"
                  iconStyle="solid"
                  size={16}
                  color={Colors.graybase}
                />
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
                size={16}
                color={Colors.primaryColor}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={onOpenFilterModal}
            accessibilityRole="button"
            accessibilityLabel="Filters">
            <Filter width={scaleWidth(14)} height={scaleHeight(14)} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.refreshOnlyRow}>
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
                size={16}
                color={Colors.primaryColor}
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Row 3: Select all / Bulk — checkers only */}
      {showBulkSelectUi && (
        <View style={styles.bulkSelectRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.dmSelectAllRow,
              {opacity: filteredDataLength > 0 ? 1 : 0.35},
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
            <View style={styles.bulkBadge}>
              <Text style={styles.bulkBadgeText}>Bulk Actions</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

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

      {!hideListTitle && (
        <InvoiceListTitle
          title={listHeaderTitle || dealerListTitle}
          count={invoiceCount}
        />
      )}

      {showBulkSelectUi && selectedInvoiceIdsLength > 0 && (
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
    marginTop: scaleHeight(2),
    marginBottom: scaleHeight(2),
    gap: scaleHeight(8),
  },
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: scaleHeight(40),
    gap: scaleWidth(8),
  },
  chipsScrollWrap: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  chipsScroll: {
    flexGrow: 0,
  },
  summaryFocusHint: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginTop: scaleHeight(-2),
    marginBottom: scaleHeight(2),
  },
  summaryChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    paddingRight: scaleWidth(4),
    minHeight: scaleHeight(40),
  },
  createBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(3),
    minHeight: scaleHeight(32),
    flexShrink: 0,
  },
  createBtnText: {
    color: Colors.white,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
  },
  bulkSelectRow: {
    minHeight: scaleHeight(40),
    justifyContent: 'center',
  },
  dmSelectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleHeight(40),
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
    borderRadius: scaleWidth(10),
    paddingHorizontal: scaleWidth(8),
    minHeight: scaleHeight(36),
    gap: scaleWidth(4),
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    padding: 0,
    margin: 0,
    height: scaleHeight(20),
    lineHeight: scaleHeight(16),
    ...(Platform.OS === 'android'
      ? {includeFontPadding: false, textAlignVertical: 'center' as const}
      : {}),
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    minHeight: scaleHeight(36),
  },
  refreshOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  refreshButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E6E4DC',
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(10),
    flexShrink: 0,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(8),
    height: scaleHeight(36),
    borderRadius: scaleWidth(10),
    gap: scaleWidth(4),
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(12),
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  buttonIconContainer: {
    width: scaleWidth(14),
    height: scaleHeight(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButton: {
    backgroundColor: Colors.primaryColor,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(10),
    alignItems: 'center',
    marginTop: scaleHeight(4),
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
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleHeight(36),
    paddingHorizontal: scaleWidth(10),
    borderRadius: scaleWidth(18),
    borderWidth: 1,
    gap: scaleWidth(6),
    flexShrink: 0,
  },
  actionChipPending: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  actionChipPendingActive: {
    backgroundColor: '#DBEAFE',
    borderColor: Colors.tertiaryBlue,
  },
  actionChipDraft: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  actionChipDraftActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  actionChipRequired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionChipRequiredActive: {
    backgroundColor: '#FEE2E2',
    borderColor: Colors.red,
  },
  actionChipCount: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyBold,
    flexShrink: 0,
  },
  actionChipLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    flexShrink: 0,
  },
  actionCountPending: {
    color: Colors.tertiaryBlue,
  },
  actionCountDraft: {
    color: '#D97706',
  },
  actionCountRequired: {
    color: Colors.red,
  },
  contextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    paddingTop: scaleHeight(6),
  },
  productChip: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(6),
    flexShrink: 0,
  },
  productChipText: {
    color: Colors.white,
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyBold,
  },
  contextProgramText: {
    flex: 1,
    minWidth: 0,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleHeight(4),
    paddingBottom: scaleHeight(2),
    gap: scaleWidth(8),
  },
  listHeaderLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  countBadge: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(3),
    borderRadius: scaleWidth(10),
    minWidth: scaleWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});

