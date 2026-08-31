import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

const DASH = '-';

export type SOALoanDetailsCardProps = {
  anchorName?: string | null;
  bankName?: string | null;
  programApprovalDate?: string | null;
  programExpiryDate?: string | null;
  status?: string | null;
  programLimit?: string | number | null;
  availableLimit?: string | number | null;
  roiPercent?: string | number | null;
  duePrincipal?: string | number | null;
  dueInterest?: string | number | null;
  duePenalInterest?: string | number | null;
  dueCharges?: string | number | null;
  totalDue?: string | number | null;
  receivedPrincipal?: string | number | null;
  receivedInterest?: string | number | null;
  receivedPenalInterest?: string | number | null;
  receivedCharges?: string | number | null;
  totalReceived?: string | number | null;
  expanded: boolean;
  onToggleExpanded: () => void;
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
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function displayRoi(value?: string | number | null): string {
  const text = displayText(value);
  if (text === DASH) {
    return DASH;
  }
  return text.includes('%') ? text : `${text}%`;
}

function DetailRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ChevronIcon({pointingUp}: {pointingUp: boolean}) {
  return (
    <View style={pointingUp ? undefined : styles.chevronDown}>
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.7071 10.7071C12.3166 11.0976 11.6834 11.0976 11.2929 10.7071L8 7.41421L4.70711 10.7071C4.31658 11.0976 3.68342 11.0976 3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289L7.29289 5.29289C7.68342 4.90237 8.31658 4.90237 8.70711 5.29289L12.7071 9.29289C13.0976 9.68342 13.0976 10.3166 12.7071 10.7071Z"
          fill={Colors.primaryColor}
        />
      </Svg>
    </View>
  );
}

function ToggleControl({
  expanded,
  onPress,
  compact,
}: {
  expanded: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={8}
      style={[styles.toggleButton, compact && styles.toggleButtonCompact]}
      accessibilityRole="button">
      <Text style={styles.toggleText}>
        {expanded ? 'Hide details' : 'View more details'}
      </Text>
      <ChevronIcon pointingUp={expanded} />
    </TouchableOpacity>
  );
}
function AmountRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.amountRow}>
      <Text style={[styles.amountLabel, emphasize && styles.amountLabelBold]}>
        {label}
      </Text>
      <Text
        style={[styles.amountValue, emphasize && styles.amountValueBold]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export const SOALoanDetailsCard: React.FC<SOALoanDetailsCardProps> = ({
  anchorName,
  bankName,
  programApprovalDate,
  programExpiryDate,
  status,
  programLimit,
  availableLimit,
  roiPercent,
  duePrincipal,
  dueInterest,
  duePenalInterest,
  dueCharges,
  totalDue,
  receivedPrincipal,
  receivedInterest,
  receivedPenalInterest,
  receivedCharges,
  totalReceived,
  expanded,
  onToggleExpanded,
}) => {
  const statusText = displayText(status);
  const isActive = statusText.toLowerCase() === 'active';
  const bankText = displayText(bankName);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>LOAN DETAILS</Text>
        <ToggleControl
          compact
          expanded={expanded}
          onPress={onToggleExpanded}
        />
      </View>

      <DetailRow label="Anchor" value={displayText(anchorName)} />
      <DetailRow
        label="Bank"
        value={bankText}
        valueStyle={bankText !== DASH ? styles.bankValue : undefined}
      />
      {expanded ? (
        <>
          <DetailRow
            label="Program Approval Date"
            value={displayText(programApprovalDate)}
          />
          <DetailRow
            label="Program Expiry Date"
            value={displayText(programExpiryDate)}
          />
        </>
      ) : null}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Account Status</Text>
        {statusText === DASH ? (
          <Text style={styles.detailValue}>{DASH}</Text>
        ) : (
          <View
            style={[
              styles.statusPill,
              isActive ? styles.statusPillActive : styles.statusPillInactive,
            ]}>
            <View
              style={[
                styles.statusDot,
                isActive ? styles.statusDotActive : styles.statusDotInactive,
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isActive ? styles.statusTextActive : styles.statusTextInactive,
              ]}>
              {statusText}
            </Text>
          </View>
        )}
      </View>

      {!expanded ? (
        <DetailRow label="Total Due" value={displayAmount(totalDue)} />
      ) : null}

      {expanded ? (
        <>
          <DetailRow
            label="Program Limit"
            value={displayAmount(programLimit)}
          />
          <DetailRow
            label="Available Limit"
            value={displayAmount(availableLimit)}
          />
          <DetailRow label="ROI%" value={displayRoi(roiPercent)} />

          <View style={styles.breakdownRow}>
            <View style={[styles.breakdownCol, styles.dueCol]}>
              <Text style={[styles.breakdownTitle, styles.dueTitle]}>DUE</Text>
              <AmountRow
                label="Principal"
                value={displayAmount(duePrincipal)}
              />
              <AmountRow label="Interest" value={displayAmount(dueInterest)} />
              <AmountRow
                label="Penal Interest"
                value={displayAmount(duePenalInterest)}
              />
              <AmountRow label="Charges" value={displayAmount(dueCharges)} />
              <AmountRow
                label="Total Due"
                value={displayAmount(totalDue)}
                emphasize
              />
            </View>

            <View style={[styles.breakdownCol, styles.receivedCol]}>
              <Text style={[styles.breakdownTitle, styles.receivedTitle]}>
                RECEIVED
              </Text>
              <AmountRow
                label="Principal"
                value={displayAmount(receivedPrincipal)}
              />
              <AmountRow
                label="Interest"
                value={displayAmount(receivedInterest)}
              />
              <AmountRow
                label="Penal Interest"
                value={displayAmount(receivedPenalInterest)}
              />
              <AmountRow
                label="Charges"
                value={displayAmount(receivedCharges)}
              />
              <AmountRow
                label="Total Received"
                value={displayAmount(totalReceived)}
                emphasize
              />
            </View>
          </View>
        </>
      ) : null}

      <ToggleControl expanded={expanded} onPress={onToggleExpanded} />
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
  bankValue: {
    color: '#C2410C',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(4),
    marginTop: scaleHeight(10),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(10),
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(8),
  },
  toggleButtonCompact: {
    marginTop: 0,
    paddingVertical: scaleHeight(4),
  },
  toggleText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  chevronDown: {
    transform: [{rotate: '180deg'}],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleWidth(20),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(3),
    gap: scaleWidth(4),
  },
  statusPillActive: {
    backgroundColor: '#E8F8EE',
  },
  statusPillInactive: {
    backgroundColor: '#FEECEC',
  },
  statusDot: {
    width: scaleWidth(6),
    height: scaleWidth(6),
    borderRadius: scaleWidth(3),
  },
  statusDotActive: {
    backgroundColor: Colors.green,
  },
  statusDotInactive: {
    backgroundColor: Colors.red,
  },
  statusPillText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
  statusTextActive: {
    color: Colors.green,
  },
  statusTextInactive: {
    color: Colors.red,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: scaleWidth(10),
    marginTop: scaleHeight(12),
  },
  breakdownCol: {
    flex: 1,
    borderRadius: scaleWidth(10),
    padding: scaleWidth(10),
  },
  dueCol: {
    backgroundColor: '#FFF7ED',
  },
  receivedCol: {
    backgroundColor: '#F0FDF4',
  },
  breakdownTitle: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyBold,
    marginBottom: scaleHeight(8),
    letterSpacing: 0.4,
  },
  dueTitle: {
    color: '#C2410C',
  },
  receivedTitle: {
    color: '#15803D',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scaleWidth(6),
    marginBottom: scaleHeight(4),
  },
  amountLabel: {
    fontSize: scaleFont(10),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
    flex: 1,
  },
  amountValue: {
    fontSize: scaleFont(10),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
    flex: 1,
    textAlign: 'right',
  },
  amountLabelBold: {
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  amountValueBold: {
    fontFamily: Fonts.GilroyBold,
  },
});
