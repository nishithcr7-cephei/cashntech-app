import React, {useState} from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SkeletonList} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatIndianNumber} from '@utils/Utils';
import {ProgramSummaryAmounts} from '@store/soa/dealer/dealer.types';

const EXPANDED_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.36);

/**
 * Rollback: set to `false` (or remove `<SOAVendorListProgramHeader />` from SOADealerList).
 * Isolated so vendor list cards stay unchanged.
 */
export const SHOW_SOA_VENDOR_LIST_PROGRAM_HEADER = true;

export type SOAVendorListProgramHeaderProps = {
  programName?: string | null;
  anchorName?: string | null;
  bankName?: string | null;
  status?: string | null;
  programApprovalDate?: string | null;
  programExpiryDate?: string | null;
  programLimit?: string | null;
  availableLimit?: string | null;
  roiPercent?: string | null;
  due?: ProgramSummaryAmounts | null;
  received?: ProgramSummaryAmounts | null;
  loading?: boolean;
};

const DASH = '-';

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
  if (raw.includes('₹')) {
    return raw;
  }
  const num = Number(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(num)) {
    return raw;
  }
  return `₹ ${formatIndianNumber(String(num))}`;
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

export const SOAVendorListProgramHeader: React.FC<
  SOAVendorListProgramHeaderProps
> = ({
  programName,
  anchorName,
  bankName,
  status,
  programApprovalDate,
  programExpiryDate,
  programLimit,
  availableLimit,
  roiPercent,
  due,
  received,
  loading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const statusText = displayText(status);
  const isActive = statusText.toLowerCase() === 'active';
  const totalDue = due?.total ?? null;

  if (loading) {
    return (
      <View style={styles.card}>
        <SkeletonList variant="row" count={2} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>LOAN DETAILS</Text>
      </View>
      <DetailRow label="Program Name" value={displayText(programName)} />
      <DetailRow label="Anchor" value={displayText(anchorName)} />
      <DetailRow label="Bank" value={displayText(bankName)} />
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Account Status</Text>
        <Text
          style={[
            styles.detailValue,
            statusText !== DASH &&
              (isActive ? styles.statusActive : styles.statusInactive),
          ]}>
          {statusText}
        </Text>
      </View>
      <DetailRow label="Total Due" value={displayAmount(totalDue)} />

      {expanded ? (
        <ScrollView
          style={styles.expandedScroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator>
          <DetailRow
            label="Program Approval Date"
            value={displayText(programApprovalDate)}
          />
          <DetailRow
            label="Program Expiry Date"
            value={displayText(programExpiryDate)}
          />
          <DetailRow
            label="Program Limit"
            value={displayAmount(programLimit)}
          />
          <DetailRow
            label="Available Limit"
            value={displayAmount(availableLimit)}
          />
          <DetailRow label="ROI%" value={displayText(roiPercent)} />

          <View style={styles.breakdownRow}>
            <View style={[styles.breakdownCol, styles.dueCol]}>
              <Text style={[styles.breakdownTitle, styles.dueTitle]}>DUE</Text>
              <AmountRow
                label="Principal"
                value={displayAmount(due?.principal)}
              />
              <AmountRow
                label="Interest"
                value={displayAmount(due?.interest)}
              />
              <AmountRow
                label="Penal Interest"
                value={displayAmount(due?.penalInterest)}
              />
              <AmountRow
                label="Charges"
                value={displayAmount(due?.charges)}
              />
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
                value={displayAmount(received?.principal)}
              />
              <AmountRow
                label="Interest"
                value={displayAmount(received?.interest)}
              />
              <AmountRow
                label="Penal Interest"
                value={displayAmount(received?.penalInterest)}
              />
              <AmountRow
                label="Charges"
                value={displayAmount(received?.charges)}
              />
              <AmountRow
                label="Total Received"
                value={displayAmount(received?.total)}
                emphasize
              />
            </View>
          </View>
        </ScrollView>
      ) : null}

      <TouchableOpacity
        onPress={() => setExpanded(prev => !prev)}
        hitSlop={8}
        style={styles.toggleButton}>
        <Text style={styles.toggleText}>
          {expanded ? 'Hide details' : 'View more details'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(14),
    marginTop: scaleHeight(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(6),
  },
  sectionTitle: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyBold,
    color: Colors.graybase,
    letterSpacing: 0.6,
  },
  toggleButton: {
    marginTop: scaleHeight(8),
    alignItems: 'center',
    paddingVertical: scaleHeight(4),
  },
  toggleText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  expandedScroll: {
    maxHeight: EXPANDED_MAX_HEIGHT,
    marginTop: scaleHeight(4),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  statusActive: {
    color: Colors.green,
  },
  statusInactive: {
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
