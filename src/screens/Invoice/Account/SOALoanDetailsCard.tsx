import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

const DASH = '-';

export type SOALoanDetailsCardProps = {
  creditAccountNo?: string | null;
  anchorName?: string | null;
  sanctionedLimit?: string | number | null;
  utilizedAmount?: string | number | null;
  availableLimit?: string | number | null;
  totalOutstanding?: string | number | null;
  overdueDays?: string | number | null;
};

function displayText(value?: string | number | null): string {
  if (value == null) {
    return DASH;
  }
  const text = String(value).trim();
  return text ? text : DASH;
}

function displayAmount(value?: string | number | null): string {
  if (value == null || value === '') {
    return DASH;
  }
  const raw = String(value).trim();
  if (!raw || raw === DASH) {
    return DASH;
  }
  const num = Number(raw.replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(num)) {
    return raw;
  }
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function displayOverdueDays(value?: string | number | null): string {
  if (value == null || value === '') {
    return DASH;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return displayText(value);
  }
  return `${num} Days`;
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export const SOALoanDetailsCard: React.FC<SOALoanDetailsCardProps> = ({
  creditAccountNo,
  anchorName,
  sanctionedLimit,
  utilizedAmount,
  availableLimit,
  totalOutstanding,
  overdueDays,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>LOAN DETAILS</Text>
      </View>

      <DetailRow label="Credit Account No" value={displayText(creditAccountNo)} />
      <DetailRow label="Anchor" value={displayText(anchorName)} />
      <DetailRow label="Sanctioned Limit" value={displayAmount(sanctionedLimit)} />
      <DetailRow label="Utilized Amount" value={displayAmount(utilizedAmount)} />
      <DetailRow label="Available Limit" value={displayAmount(availableLimit)} />
      <DetailRow
        label="Total Outstanding"
        value={displayAmount(totalOutstanding)}
      />
      <DetailRow label="Overdue Days" value={displayOverdueDays(overdueDays)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(14),
    marginHorizontal: scaleWidth(16),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
  },
  sectionTitle: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyBold,
    color: Colors.graybase,
    letterSpacing: 0.6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(6),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(5),
  },
  detailLabel: {
    flex: 1,
    fontSize: scaleFont(12),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  detailValue: {
    flex: 1.2,
    fontSize: scaleFont(12),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroySemiBold,
    textAlign: 'right',
  },
});
