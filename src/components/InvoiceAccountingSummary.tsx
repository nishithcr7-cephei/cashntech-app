import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AdvanceInterestInfoButton} from '@components/AdvanceInterestFormulaModal';
import {
  formatMarginDeductionLabel,
  INVOICE_SUMMARY_LABELS,
} from '@constants/invoiceSummaryLabels';
import {
  computeInvoiceSubTotalAfterTds,
  computeInvoiceTaxableBase,
  formatIndianCurrency,
} from '@utils/invoiceTotals';

const SUMMARY = INVOICE_SUMMARY_LABELS;
const MINUS = '\u2212';

export type InvoiceAccountingSummaryProps = {
  basicAmount: number;
  discount: number;
  gstAmount: number;
  tdsAmount: number;
  advanceInterest?: number;
  netDisbursementAmount: number;
  showAdvanceInterest?: boolean;
  /** When set (from financing-preview), show Margin Deduction + Financed Amount. */
  showMarginFinancing?: boolean;
  marginPercent?: number;
  marginDeduction?: number;
  financedAmount?: number;
  onInvoiceAmountInfoPress?: () => void;
  onDisbursementRequestedInfoPress?: () => void;
  onAdvanceInterestInfoPress?: () => void;
  onNetDisbursementInfoPress?: () => void;
  /** Prefix before the formatted amount, e.g. `₹`. */
  amountPrefix?: string;
  /** Suffix after the formatted amount, e.g. `/-`. */
  amountSuffix?: string;
};

type LineKind = 'plain' | 'subtotal' | 'net';

function fmt(
  n: number,
  prefix: string,
  suffix: string,
): string {
  return `${prefix}${formatIndianCurrency(n)}${suffix}`;
}

const AccountingRow: React.FC<{
  sign?: string;
  label: string;
  value: string;
  kind?: LineKind;
  trailing?: React.ReactNode;
}> = ({sign, label, value, kind = 'plain', trailing}) => {
  const isSubtotal = kind === 'subtotal';
  const isNet = kind === 'net';
  return (
    <View style={[styles.row, isNet && styles.netRow]}>
      <Text
        style={[
          styles.sign,
          isSubtotal && styles.signSubtotal,
          isNet && styles.signNet,
        ]}>
        {sign || ''}
      </Text>
      <View style={styles.labelWrap}>
        <Text
          style={[
            styles.label,
            isSubtotal && styles.labelSubtotal,
            isNet && styles.labelNet,
          ]}
          numberOfLines={2}>
          {label}
        </Text>
        {trailing}
      </View>
      <Text
        style={[
          styles.value,
          isSubtotal && styles.valueSubtotal,
          isNet && styles.valueNet,
        ]}>
        {value}
      </Text>
    </View>
  );
};

/**
 * Web-parity waterfall:
 * Invoice Amount = Basic − Discount + GST
 * Requested (A) = Invoice Amount − TDS
 * [optional] − Margin → Financed (F)
 * Net = (F or A) − Advance Interest
 */
export const InvoiceAccountingSummary: React.FC<
  InvoiceAccountingSummaryProps
> = ({
  basicAmount,
  discount,
  gstAmount,
  tdsAmount,
  advanceInterest = 0,
  netDisbursementAmount,
  showAdvanceInterest = false,
  showMarginFinancing = false,
  marginPercent = 0,
  marginDeduction = 0,
  financedAmount,
  onInvoiceAmountInfoPress,
  onDisbursementRequestedInfoPress,
  onAdvanceInterestInfoPress,
  onNetDisbursementInfoPress,
  amountPrefix = '',
  amountSuffix = '',
}) => {
  const invoiceAmount = computeInvoiceTaxableBase(
    basicAmount,
    discount,
    gstAmount,
  );
  const requestedAmount = computeInvoiceSubTotalAfterTds(
    basicAmount,
    discount,
    gstAmount,
    tdsAmount,
  );
  const money = (n: number) => fmt(n, amountPrefix, amountSuffix);
  const financed =
    financedAmount != null && Number.isFinite(financedAmount)
      ? financedAmount
      : requestedAmount - marginDeduction;

  return (
    <View style={styles.card}>
      <AccountingRow
        label={SUMMARY.invoiceAmount}
        value={money(basicAmount)}
      />
      <AccountingRow
        sign={MINUS}
        label={SUMMARY.discount}
        value={money(discount)}
      />
      <AccountingRow
        sign="+"
        label={SUMMARY.taxAmount}
        value={money(gstAmount)}
      />
      <View style={styles.rule} />
      <AccountingRow
        label={SUMMARY.grossInvoiceValue}
        value={money(invoiceAmount)}
        kind="subtotal"
        trailing={
          onInvoiceAmountInfoPress ? (
            <AdvanceInterestInfoButton onPress={onInvoiceAmountInfoPress} />
          ) : null
        }
      />
      <AccountingRow
        sign={MINUS}
        label={SUMMARY.tdsDeduction}
        value={money(tdsAmount)}
      />
      <View style={styles.rule} />
      <AccountingRow
        label={SUMMARY.disbursementRequestedAmount}
        value={money(requestedAmount)}
        kind="subtotal"
        trailing={
          onDisbursementRequestedInfoPress ? (
            <AdvanceInterestInfoButton
              onPress={onDisbursementRequestedInfoPress}
            />
          ) : null
        }
      />
      {showMarginFinancing ? (
        <>
          <AccountingRow
            sign={MINUS}
            label={formatMarginDeductionLabel(marginPercent)}
            value={money(marginDeduction)}
          />
          <View style={styles.rule} />
          <AccountingRow
            label={SUMMARY.financedAmount}
            value={money(financed)}
            kind="subtotal"
          />
        </>
      ) : null}
      {showAdvanceInterest ? (
        <AccountingRow
          sign={MINUS}
          label={SUMMARY.advanceInterestDeduction}
          value={money(advanceInterest)}
          trailing={
            onAdvanceInterestInfoPress ? (
              <AdvanceInterestInfoButton onPress={onAdvanceInterestInfoPress} />
            ) : null
          }
        />
      ) : null}
      <View style={styles.rule} />
      <AccountingRow
        label={SUMMARY.netDisbursementAmount}
        value={money(netDisbursementAmount)}
        kind="net"
        trailing={
          onNetDisbursementInfoPress ? (
            <AdvanceInterestInfoButton onPress={onNetDisbursementInfoPress} />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  netRow: {
    backgroundColor: '#F3F4F6',
    marginHorizontal: -10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: -8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  sign: {
    width: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  signSubtotal: {
    color: '#111827',
  },
  signNet: {
    color: '#111827',
  },
  labelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
    minWidth: 0,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  labelSubtotal: {
    fontWeight: '700',
    color: '#111827',
  },
  labelNet: {
    fontWeight: '700',
    color: '#111827',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
  },
  valueSubtotal: {
    fontWeight: '700',
    color: '#111827',
  },
  valueNet: {
    fontWeight: '700',
    color: '#111827',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D1D5DB',
    marginVertical: 4,
    marginLeft: 20,
  },
});
