import * as React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Dots} from '@assets/Icons';
import type {InvoiceRow} from './types';

const STATUS_ORANGE = '#E86C00';

function getInvoiceStatusStyle(invoiceStatus: string) {
  const s = (invoiceStatus || '').toLowerCase();
  if (s.includes('in progress')) return styles.statusOrange;
  if (s.includes('reject')) return styles.statusRed;
  if (s.includes('completed') || s.includes('submitted') || s.includes('created') || s.includes('disbursed')) return styles.statusGreen;
  return styles.infoValue;
}

function getApprovalStatusStyle(approvalStatus: string) {
  const s = (approvalStatus || '').toLowerCase();
  if (s.includes('pending')) return styles.statusOrange;
  if (s.includes('reject')) return styles.statusRed;
  if (s.includes('completed') || s.includes('approval complete')) return styles.statusGreen;
  return styles.infoValue;
}

function getAdminStatusStyle(adminStatus: string) {
  const s = (adminStatus || '').toLowerCase();
  if (s === 'verify' || s === 'verified' || s === 'submitted') return styles.adminStatusGreen;
  if (s === 'hold') return styles.adminStatusGrayBrown;
  if (s === 'reject' || s === 'rejected') return styles.adminStatusRed;
  return styles.infoValue;
}

type Props = {
  row: InvoiceRow;
  isAnchorMaker: boolean;
  isDealerMaker: boolean;
  isDealerChecker: boolean;
  isAnchorChecker: boolean;
  isCashnTechUser?: boolean;
  isSelected: boolean;
  onMenuToggle: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onInvoiceNoPress?: (invoiceId: string, invoiceNo: string) => void;
  registerMenuRef: (id: string, ref: View | null) => void;
};

export const InvoiceDetailsCard: React.FC<Props> = ({
  row,
  isAnchorMaker,
  isDealerMaker,
  isDealerChecker,
  isAnchorChecker,
  isCashnTechUser = false,
  isSelected,
  onMenuToggle,
  onToggleSelection,
  onInvoiceNoPress,
  registerMenuRef,
}) => {
  const invoiceStatusLower = (row.invoiceStatus || '').toLowerCase();
  const approvalStatusLower = (row.approvalStatus || '').toLowerCase();
  const showPendingBlueDot = isAnchorChecker
    ? approvalStatusLower.includes('pending')
    : invoiceStatusLower.includes('in progress');
  const partyTitle = isDealerMaker || isDealerChecker
    ? row.counterParty || row.dealerName
    : row.dealerName;

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.listCard}>
        {(isAnchorMaker || isDealerMaker || isDealerChecker || isAnchorChecker || isCashnTechUser) && (
          <View
            ref={(r: View | null) => registerMenuRef(row.id, r)}
            collapsable={false}
            style={styles.threeDotsButton}>
            <TouchableOpacity
              onPress={() => onMenuToggle(row.id)}
              activeOpacity={0.7}
              hitSlop={10}
              style={styles.threeDotsTouchable}>
              <Dots
                width={scaleWidth(20)}
                height={scaleHeight(20)}
                style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardHeaderContainer}>
          {(isDealerChecker || isAnchorChecker) ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dmCardHeaderRow}
              onPress={() => onToggleSelection(row.id)}>
              <View
                style={[
                  styles.checkboxBox,
                  isSelected && styles.checkboxBoxSelected,
                ]}>
                {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <View style={styles.dmCardHeaderTextWrap}>
                {showPendingBlueDot && <View style={styles.pendingDotInline} />}
                {!!partyTitle && (
                  <Text style={styles.cardTitle}>{partyTitle}</Text>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <>
              {showPendingBlueDot && <View style={styles.pendingDotStandalone} />}
              {!!partyTitle && (
                <Text style={[styles.cardTitle, styles.cardTitleSpacing]}>
                  {partyTitle}
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.infoGrid}>
          {/* Chip order: Invoice No → Bank Name → Product Name → Program Name → Counter Party → Invoice Amount → Invoice Date → Upload Date → Due Date → Invoice Status → Approval Status → Admin Status */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice No</Text>
            {onInvoiceNoPress ? (
              <TouchableOpacity
                onPress={() => onInvoiceNoPress(row.id, row.invoiceNo || row.id)}
                activeOpacity={0.7}>
                <Text style={[styles.infoValue, styles.invoiceNoLink]}>{row.invoiceNo}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.infoValue}>{row.invoiceNo}</Text>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{row.bankName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Product Name</Text>
            <Text style={styles.infoValue}>{row.productName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Program Name</Text>
            <Text style={styles.infoValue}>{row.programName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Counter Party</Text>
            <Text style={styles.infoValue}>{row.counterParty}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Amount</Text>
            <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{row.invoiceDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Upload Date</Text>
            <Text style={styles.infoValue}>{row.requestDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{row.dueDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Status</Text>
            <Text style={[styles.infoValue, getInvoiceStatusStyle(row.invoiceStatus)]}>{row.invoiceStatus}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Approval Status</Text>
            <Text style={[styles.infoValue, getApprovalStatusStyle(row.approvalStatus)]}>{row.approvalStatus}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Admin Status</Text>
            <Text style={[styles.infoValue, getAdminStatusStyle(row.adminStatus)]}>{row.adminStatus}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderContainer: {
    marginBottom: scaleHeight(12),
    paddingRight: scaleWidth(50),
  },
  pendingDotInline: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
    backgroundColor: Colors.tertiaryBlue,
    marginBottom: scaleHeight(6),
  },
  pendingDotStandalone: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
    backgroundColor: Colors.tertiaryBlue,
    marginBottom: scaleHeight(6),
  },
  cardTitleSpacing: {
    marginBottom: scaleHeight(4),
  },
  dmCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(4),
  },
  dmCardHeaderTextWrap: {
    flex: 1,
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
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  statusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  statusOrange: {
    color: STATUS_ORANGE,
    fontFamily: Fonts.GilroySemiBold,
  },
  statusRed: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  adminStatusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  adminStatusGrayBrown: {
    color: '#6B5B4F',
    fontFamily: Fonts.GilroySemiBold,
  },
  adminStatusRed: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  infoColumn: {
    width: '47%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(12),
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  invoiceNoLink: {
    color: Colors.tertiaryColor,
    textDecorationLine: 'underline',
  },
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  threeDotsTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
