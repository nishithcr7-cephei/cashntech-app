import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type ApproveRejectInvoiceDetails = {
  subTotal?: string;
  withholdingTaxesPercent?: string;
  withholdingAmount?: string;
  finalPayableAmount?: string;
  finalDueDate?: string;
  /** Anchor checker layout fields */
  dealerName?: string;
  anchorName?: string;
  invoiceDate?: string;
  invoiceDueDate?: string;
  invoiceAmount?: string;
};

type ApproveRejectModalProps = {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string | null;
  invoiceNo?: string | null;
  /** Use 'anchor_checker' for Dealer Name, Anchor Name, Invoice Date/Due Date, Invoice Amount layout; 'cashntech_verification' for CashnTech Verify/Reject */
  variant?: 'default' | 'anchor_checker' | 'cashntech_verification';
  invoiceDetails?: ApproveRejectInvoiceDetails;
  /** Show loading in details table (e.g. when fetching invoice details for anchor_checker) */
  detailsLoading?: boolean;
  onApprove?: (invoiceId: string, remarks?: string) => void;
  onReject?: (invoiceId: string, remarks?: string) => void;
};

export const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({
  visible,
  onClose,
  invoiceId,
  invoiceNo,
  variant = 'default',
  invoiceDetails,
  detailsLoading = false,
  onApprove,
  onReject,
}) => {
  const insets = useSafeAreaInsets();
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Verified' | 'Hold' | 'Reject' | null>(null);

  const isAnchorChecker = variant === 'anchor_checker';
  const isCashnTechVerification = variant === 'cashntech_verification';
  const invoiceLabel = invoiceNo || invoiceId || 'N/A';
  const modalTitle = isAnchorChecker
    ? 'Invoice Verification'
    : isCashnTechVerification
      ? `Invoice : ${invoiceLabel}`
      : 'Approval or reject popup';
  const confirmText = isCashnTechVerification ? (
    <>
      Are you sure you want to verify or reject this Invoice{' '}
      <Text style={styles.invoiceNoBold}>{invoiceLabel}</Text>?
    </>
  ) : (
    <>
      Are you sure, you want to approve or reject this{' '}
      <Text style={styles.invoiceNoBold}>
        Invoice / Unique Ref. No - {invoiceNo || invoiceId || 'N/A'}
      </Text>
      ?
    </>
  );
  const primaryButtonLabel = isCashnTechVerification ? 'Verify' : 'Approve';
  const secondaryButtonLabel = 'Reject';

  // Default invoice details if not provided
  const details = invoiceDetails || {
    subTotal: '10,80,025/-',
    withholdingTaxesPercent: '0.00/-',
    withholdingAmount: '0.00/-',
    finalPayableAmount: '10,80,025/-',
    finalDueDate: 'dd-mm-yyyy',
    dealerName: 'Dealer Name',
    anchorName: 'Anchor Name',
    invoiceDate: 'DD / MM / YYYY',
    invoiceDueDate: 'DD / MM / YYYY',
    invoiceAmount: 'Rs. 0 /-',
  };

  const handleApprove = () => {
    if (invoiceId && onApprove) {
      onApprove(invoiceId, remarks.trim() || undefined);
    }
    handleClose();
  };

  const handleReject = () => {
    if (invoiceId && onReject) {
      onReject(invoiceId, remarks.trim() || undefined);
    }
    handleClose();
  };

  const handleClose = () => {
    setRemarks('');
    setActionType(null);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          style={[
            styles.overlay,
            {paddingTop: insets.top, paddingBottom: insets.bottom},
          ]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Header with Title and Close Button */}
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    isAnchorChecker && styles.modalTitleAnchorChecker,
                  ]}>
                  {modalTitle}
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.modalContent}>
                {isAnchorChecker ? (
                  <>
                    <Text style={styles.anchorCheckerConfirmText}>
                      Are you sure, you want to approve or reject this invoice?
                    </Text>
                    <Text style={styles.anchorCheckerRefLine}>
                      Invoice / Unique Ref. No - {invoiceLabel}
                    </Text>
                    <View style={styles.detailsSectionHeader}>
                      <Text style={styles.detailsSectionHeaderText}>Details</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.confirmationText}>{confirmText}</Text>
                )}

                {/* Invoice Details Table */}
                <View style={styles.detailsTable}>
                  {detailsLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#666" />
                      <Text style={styles.loadingText}>Loading invoice details...</Text>
                    </View>
                  ) : (isAnchorChecker || isCashnTechVerification) ? (
                    <>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Invoice Number:</Text>
                        <Text style={styles.tableValue}>{invoiceLabel}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Anchor Name:</Text>
                        <Text style={styles.tableValue}>{details.anchorName || '-'}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Dealer Name:</Text>
                        <Text style={styles.tableValue}>{details.dealerName || '-'}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Invoice Amount:</Text>
                        <Text style={styles.tableValue}>{details.invoiceAmount || 'Rs. 0 /-'}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Invoice Date:</Text>
                        <Text style={styles.tableValue}>{details.invoiceDate || 'DD / MM / YYYY'}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Invoice Due Date:</Text>
                        <Text style={styles.tableValue}>{details.invoiceDueDate || 'DD / MM / YYYY'}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Sub Total:</Text>
                        <Text style={styles.tableValue}>{details.subTotal}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Withholding Taxes (%):</Text>
                        <Text style={styles.tableValue}>{details.withholdingTaxesPercent}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Withholding Amount:</Text>
                        <Text style={styles.tableValue}>{details.withholdingAmount}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Final Payable Amount:</Text>
                        <Text style={styles.tableValue}>{details.finalPayableAmount}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Final Due Date:</Text>
                        <Text style={styles.tableValue}>{details.finalDueDate}</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Status dropdown (CashnTech admin verification only) */}
                {isCashnTechVerification && (
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Status</Text>
                    <TouchableOpacity
                      style={styles.statusDropdown}
                      activeOpacity={0.8}
                      onPress={() => setStatusDropdownOpen(prev => !prev)}>
                      <Text
                        style={[
                          styles.statusDropdownText,
                          !selectedStatus && styles.statusPlaceholderText,
                        ]}>
                        {selectedStatus ?? 'Select status'}
                      </Text>
                      <Text style={styles.statusDropdownIcon}>▼</Text>
                    </TouchableOpacity>
                    {statusDropdownOpen && (
                      <View style={styles.statusOptions}>
                        {(['Verified', 'Hold', 'Reject'] as const).map(option => (
                          <TouchableOpacity
                            key={option}
                            style={styles.statusOption}
                            activeOpacity={0.8}
                            onPress={() => {
                              setSelectedStatus(option);
                              setStatusDropdownOpen(false);
                            }}>
                            <Text style={styles.statusOptionText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Remarks Input */}
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksLabel}>Remark :</Text>
                  <TextInput
                    style={styles.remarksInput}
                    placeholder="Enter remarks..."
                    placeholderTextColor={Colors.graybase}
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={handleReject}>
                    <Text style={styles.rejectButtonText}>{secondaryButtonLabel}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={handleApprove}>
                    <Text style={styles.approveButtonText}>{primaryButtonLabel}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(24),
    paddingBottom: scaleHeight(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  modalTitle: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flex: 1,
  },
  modalTitleAnchorChecker: {
    textAlign: 'center',
  },
  /** Anchor checker: order matches web — question, then ref, then Details bar */
  anchorCheckerConfirmText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: scaleHeight(12),
    lineHeight: scaleHeight(20),
  },
  anchorCheckerRefLine: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    textAlign: 'center',
    marginBottom: scaleHeight(12),
  },
  detailsSectionHeader: {
    backgroundColor: '#E8EAED',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    marginBottom: scaleHeight(10),
    marginHorizontal: -scaleWidth(16),
    borderRadius: scaleWidth(6),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  detailsSectionHeaderText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  closeButton: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(24),
    color: Colors.darkblack,
    fontWeight: '300',
  },
  modalContent: {
    padding: scaleWidth(16),
  },
  confirmationText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(16),
    lineHeight: scaleHeight(20),
  },
  invoiceNoBold: {
    fontFamily: Fonts.GilroySemiBold,
    fontWeight: '600',
  },
  detailsTable: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(16),
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  statusContainer: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(8),
  },
  statusLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D0D4DD',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    backgroundColor: '#F7F8FB',
  },
  statusDropdownText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  statusPlaceholderText: {
    color: Colors.graybase,
  },
  statusDropdownIcon: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
  },
  statusOptions: {
    marginTop: scaleHeight(4),
    borderWidth: 1,
    borderColor: '#D0D4DD',
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  statusOption: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
  },
  statusOptionText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  tableLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flex: 1,
  },
  tableValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(24),
  },
  loadingText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  remarksContainer: {
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(8),
  },
  remarksLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    minHeight: scaleHeight(48),
    backgroundColor: '#F7F8FB',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  actionButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: Colors.green,
  },
  rejectButton: {
    backgroundColor: '#9E9E9E', // Gray color as shown in screenshot
  },
  approveButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  rejectButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
