import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  formatPendingWithChip,
  getAdminStatusStyles,
  getApprovalStatusStyles,
  getInvoiceStatusStyles,
} from '@utils/invoiceStatusDisplay';

type Props = {
  invoiceStatus?: string | null;
  approvalStatus?: string | null;
  adminStatus?: string | null;
  /** Create preview: "Will go to"; live invoice: "Pending with". */
  mode?: 'preview' | 'live';
  style?: ViewStyle;
};

export const InvoiceStatusBadges: React.FC<Props> = ({
  invoiceStatus,
  approvalStatus,
  adminStatus,
  mode = 'live',
  style,
}) => {
  const invoice = String(invoiceStatus || '').trim();
  const pendingChip = formatPendingWithChip(
    String(approvalStatus || '').trim(),
    mode,
  );
  const admin = String(adminStatus || '').trim();
  const showCompleted =
    mode === 'live' &&
    !pendingChip &&
    /completed|approval complete/i.test(String(approvalStatus || ''));

  if (!invoice && !pendingChip && !admin && !showCompleted) {
    return null;
  }

  return (
    <View style={[styles.row, style]}>
      {!!invoice && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                getInvoiceStatusStyles(invoice).backgroundColor,
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {color: getInvoiceStatusStyles(invoice).color},
            ]}>
            {invoice}
          </Text>
        </View>
      )}
      {!!pendingChip && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                getApprovalStatusStyles(pendingChip).backgroundColor,
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {color: getApprovalStatusStyles(pendingChip).color},
            ]}>
            {pendingChip}
          </Text>
        </View>
      )}
      {showCompleted && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                getApprovalStatusStyles(String(approvalStatus)).backgroundColor,
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {color: getApprovalStatusStyles(String(approvalStatus)).color},
            ]}>
            {approvalStatus}
          </Text>
        </View>
      )}
      {!!admin && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: getAdminStatusStyles(admin).backgroundColor,
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {color: getAdminStatusStyles(admin).color},
            ]}>
            {admin}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  badge: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(4),
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
});
