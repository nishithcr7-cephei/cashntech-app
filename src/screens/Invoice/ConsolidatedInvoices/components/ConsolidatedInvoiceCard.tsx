import React from 'react';
import {Alert, StyleSheet, TouchableOpacity, View} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  getAdminStatusStyles,
  getApprovalStatusStyles,
  getInvoiceStatusStyles,
} from '@utils/invoiceStatusDisplay';
import type {ConsolidatedInvoiceRow} from '@store/consolidatedInvoice/consolidatedInvoice.types';

type Props = {
  row: ConsolidatedInvoiceRow;
  onPress: (row: ConsolidatedInvoiceRow) => void;
};

const AMOUNT_INFO = {
  invoice: {
    title: 'Invoice Amount',
    message: 'Invoice Amount = Basic − Discount + Tax',
  },
  disbursement: {
    title: 'Disbursement Requested Amount',
    message: 'Disbursement Requested Amount = Basic − Discount + Tax − TDS',
  },
};

const NO_STATUS = {backgroundColor: '#F1F3F5', color: Colors.graybase};

const DateCell: React.FC<{label: string; value: string}> = ({label, value}) => (
  <View style={styles.dateCell}>
    <Text style={styles.dateLabel}>{label}</Text>
    <Text style={styles.dateValue}>{value}</Text>
  </View>
);

const AmountRow: React.FC<{
  label: string;
  value: string;
  info: {title: string; message: string};
}> = ({label, value, info}) => (
  <View style={styles.amountRow}>
    <View style={styles.amountLabelWrap}>
      <Text style={styles.amountLabel}>{label}</Text>
      <TouchableOpacity
        onPress={() => Alert.alert(info.title, info.message)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`How ${info.title} is calculated`}>
        <FontAwesome6
          name="circle-info"
          iconStyle="solid"
          size={scaleFont(11)}
          color={Colors.graybase}
        />
      </TouchableOpacity>
    </View>
    <Text style={styles.amountValue}>{value}</Text>
  </View>
);

const StatusCell: React.FC<{
  label: string;
  value: string;
  colors: {backgroundColor: string; color: string};
}> = ({label, value, colors}) => {
  const palette = value && value !== '-' ? colors : NO_STATUS;
  return (
    <View style={styles.statusCell}>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={[styles.statusPill, {backgroundColor: palette.backgroundColor}]}>
        <Text
          style={[styles.statusText, {color: palette.color}]}
          numberOfLines={1}>
          {value || '-'}
        </Text>
      </View>
    </View>
  );
};

const ConsolidatedInvoiceCardBase: React.FC<Props> = ({row, onPress}) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
    onPress={() => onPress(row)}
    accessibilityRole="button"
    accessibilityLabel={`Invoice ${row.invoiceNo}, ${row.productName}. Tap for details.`}>
    <Text style={styles.invoiceNo} numberOfLines={1}>
      {row.invoiceNo}
    </Text>
    <Text style={styles.loanRef} numberOfLines={1}>
      {row.loanRefNo}
    </Text>

    <View style={styles.bankRow}>
      <FontAwesome6
        name="building-columns"
        iconStyle="solid"
        size={scaleFont(11)}
        color={Colors.graybase}
        style={styles.bankIcon}
      />
      <View style={styles.flex}>
        <Text style={styles.bankName} numberOfLines={1}>
          {row.bankName}
        </Text>
        <Text style={styles.productName} numberOfLines={1}>
          {row.productName}
        </Text>
      </View>
    </View>

    <View style={styles.divider} />

    <Text style={styles.primaryParty} numberOfLines={1}>
      {row.primaryPartyName}
    </Text>
    <Text style={styles.counterParty} numberOfLines={1}>
      ↳ {row.counterPartyName}
    </Text>
    <Text style={styles.programName} numberOfLines={1}>
      {row.programName}
    </Text>

    <View style={styles.divider} />

    <View style={styles.dateGrid}>
      <DateCell label="Upload Date" value={row.uploadDate} />
      <DateCell label="Invoice Date" value={row.invoiceDate} />
      <DateCell label="GRN Date" value={row.grnDate} />
      <DateCell label="Due Date" value={row.dueDate} />
    </View>

    <View style={styles.divider} />

    <AmountRow
      label="Invoice Amount (₹)"
      value={row.invoiceAmount}
      info={AMOUNT_INFO.invoice}
    />
    <AmountRow
      label="Disb. Requested (₹)"
      value={row.disbursementRequestedAmount}
      info={AMOUNT_INFO.disbursement}
    />

    <View style={styles.divider} />

    <View style={styles.statusRow}>
      <StatusCell
        label="Invoice Status"
        value={row.invoiceStatus}
        colors={getInvoiceStatusStyles(row.invoiceStatus)}
      />
      <StatusCell
        label="Approval Status"
        value={row.approvalStatus}
        colors={getApprovalStatusStyles(row.approvalStatus)}
      />
      <StatusCell
        label="Admin Status"
        value={row.adminStatus}
        colors={getAdminStatusStyles(row.adminStatus)}
      />
    </View>
  </TouchableOpacity>
);

export const ConsolidatedInvoiceCard = React.memo(ConsolidatedInvoiceCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  flex: {
    flex: 1,
  },
  invoiceNo: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  loanRef: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scaleHeight(8),
  },
  bankIcon: {
    marginTop: scaleHeight(2),
    marginRight: scaleWidth(6),
  },
  bankName: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  productName: {
    marginTop: scaleHeight(1),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E6',
    marginVertical: scaleHeight(10),
  },
  primaryParty: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  counterParty: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  programName: {
    marginTop: scaleHeight(2),
    marginLeft: scaleWidth(14),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: scaleHeight(8),
  },
  dateCell: {
    width: '50%',
  },
  dateLabel: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  dateValue: {
    marginTop: scaleHeight(1),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  amountLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(5),
  },
  amountLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  amountValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  statusRow: {
    gap: scaleHeight(6),
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginRight: scaleWidth(10),
  },
  statusPill: {
    flexShrink: 1,
    maxWidth: '65%',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(3),
    borderRadius: scaleWidth(10),
  },
  statusText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
});
