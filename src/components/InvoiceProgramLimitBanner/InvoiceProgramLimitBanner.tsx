import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatIndianNumber} from '@utils/Utils';

export type InvoiceProgramLimitBannerProps = {
  /** Usable headroom (prefer financing-preview `available_limit` — eligibility applied). */
  availableLimit: number;
  /** Amount compared to available — financed (F) when preview is live, else invoice total. */
  invoiceAmount: number;
  /** Live-row label for the compared amount. */
  amountLabel?: string;
  sanctionedLimit?: number;
  utilizedAmount?: number;
  pipelineRequests?: number;
  /** When false, only the summary card is shown (no live exceed/remaining row). */
  showLiveStatus?: boolean;
  isProgramLevel?: boolean;
  /**
   * True when `availableLimit` comes from financing-preview (includes eligibility %).
   * Party-info sanctioned/utilized/pipeline stay as reference only.
   */
  headroomFromServer?: boolean;
  counterpartyLabel?: string;
  vendorNotSelectedYet?: boolean;
};

function formatInr(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '₹0';
  }
  return `₹${formatIndianNumber(String(Number(amount.toFixed(2))))}`;
}

export const InvoiceProgramLimitBanner: React.FC<
  InvoiceProgramLimitBannerProps
> = ({
  availableLimit,
  invoiceAmount,
  amountLabel = 'Invoice amount',
  sanctionedLimit,
  utilizedAmount,
  pipelineRequests,
  showLiveStatus = true,
  isProgramLevel = false,
  headroomFromServer = false,
  counterpartyLabel = 'Dealer',
  vendorNotSelectedYet = false,
}) => {
  const remaining = availableLimit - invoiceAmount;
  const isExceeded =
    showLiveStatus && invoiceAmount > 0 && invoiceAmount > availableLimit;
  const hasBreakdown =
    sanctionedLimit != null &&
    utilizedAmount != null &&
    pipelineRequests != null;

  const title = isProgramLevel
    ? 'Program available limit'
    : `Available limit (${counterpartyLabel})`;

  return (
    <View
      style={[
        styles.card,
        isExceeded ? styles.cardExceeded : styles.cardOk,
      ]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.availableValue, isExceeded && styles.exceededValue]}>
        {formatInr(availableLimit)}
      </Text>

      {headroomFromServer ? (
        <Text style={styles.breakdown}>
          After eligibility % (server headroom)
          {hasBreakdown
            ? ` · Reference: Sanctioned ${formatInr(sanctionedLimit!)} − Utilized ${formatInr(utilizedAmount!)} − Pipeline ${formatInr(pipelineRequests!)}`
            : ''}
        </Text>
      ) : hasBreakdown ? (
        <Text style={styles.breakdown}>
          Sanctioned {formatInr(sanctionedLimit!)} − Utilized{' '}
          {formatInr(utilizedAmount!)} − Pipeline {formatInr(pipelineRequests!)}
        </Text>
      ) : null}

      {isProgramLevel ? (
        <Text style={styles.hint}>
          {vendorNotSelectedYet
            ? `Select ${counterpartyLabel.toLowerCase()} to create invoice. Pending invoices from all ${counterpartyLabel.toLowerCase()}s on this program count toward pipeline.`
            : `Pending invoices from all ${counterpartyLabel.toLowerCase()}s on this program count toward pipeline.`}
        </Text>
      ) : null}

      {showLiveStatus && invoiceAmount > 0 ? (
        isExceeded ? (
          <Text style={styles.liveExceeded}>
            {amountLabel} {formatInr(invoiceAmount)} exceeds available limit by{' '}
            {formatInr(invoiceAmount - availableLimit)}. Reduce line items or
            discount/tax so {amountLabel.toLowerCase()} is ≤{' '}
            {formatInr(availableLimit)}.
          </Text>
        ) : (
          <Text style={styles.liveOk}>
            {amountLabel} {formatInr(invoiceAmount)} —{' '}
            {formatInr(Math.max(0, remaining))} remaining within limit.
          </Text>
        )
      ) : showLiveStatus ? (
        <Text style={styles.liveNeutral}>
          {headroomFromServer
            ? `Enter line items to compare ${amountLabel.toLowerCase()} with available limit.`
            : 'Enter line items to compare invoice amount with available limit.'}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: scaleWidth(16),
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(4),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(10),
    borderWidth: 1,
  },
  cardOk: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  cardExceeded: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  title: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  availableValue: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: '#166534',
    marginBottom: scaleHeight(6),
  },
  exceededValue: {
    color: Colors.red,
  },
  breakdown: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
  },
  hint: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
    lineHeight: scaleHeight(16),
  },
  liveOk: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: '#166534',
    lineHeight: scaleHeight(17),
  },
  liveNeutral: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    lineHeight: scaleHeight(17),
  },
  liveExceeded: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.red,
    lineHeight: scaleHeight(17),
  },
});
