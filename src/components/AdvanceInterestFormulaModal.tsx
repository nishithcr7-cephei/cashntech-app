import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors} from '@constants/index';
import {
  computeInvoiceNetTotal,
  computeInvoiceTaxableBase,
  formatIndianCurrency,
} from '@utils/invoiceTotals';

const MINUS = '\u2212';
const TIMES = '\u00d7';
const DIVIDE = '\u00f7';

export type AdvanceInterestFormulaAmounts = {
  basicAmount: number;
  discount: number;
  gstAmount: number;
  tdsAmount: number;
  advanceInterest: number;
  roiPercent?: number | string | null;
  tenorDays?: number | string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  amounts: AdvanceInterestFormulaAmounts;
};

function fmtMoney(n: number): string {
  return formatIndianCurrency(n);
}

function fmtRoi(roiPercent: number): string {
  if (!Number.isFinite(roiPercent) || roiPercent <= 0) return 'ROI%';
  const rounded = Number.isInteger(roiPercent)
    ? String(roiPercent)
    : String(Number(roiPercent.toFixed(4)).toString());
  return `${rounded}%`;
}

function fmtTenor(tenorDays: number): string {
  if (!Number.isFinite(tenorDays) || tenorDays <= 0) return 'Tenor';
  return String(Math.round(tenorDays));
}

export const AdvanceInterestInfoButton: React.FC<{onPress: () => void}> = ({
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
    accessibilityLabel="Advance Interest formula"
    accessibilityRole="button"
    activeOpacity={0.7}>
    <FontAwesome6
      name="circle-info"
      iconStyle="solid"
      size={14}
      color="#808080"
    />
  </TouchableOpacity>
);

export const AdvanceInterestFormulaModal: React.FC<Props> = ({
  visible,
  onClose,
  amounts,
}) => {
  const subTotal = computeInvoiceTaxableBase(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
  );
  const nda = computeInvoiceNetTotal(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
    amounts.tdsAmount,
    amounts.advanceInterest,
  );
  const roiPercent = Number(amounts.roiPercent) || 0;
  const tenorDays = Number(amounts.tenorDays) || 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Advance Interest</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={styles.closeText}>{'\u00d7'}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>
                <FormulaBlock
                  lines={[
                    `Sub Total = Basic ${MINUS} Discount + GST`,
                    `          = ${fmtMoney(amounts.basicAmount)} ${MINUS} ${fmtMoney(amounts.discount)} + ${fmtMoney(amounts.gstAmount)}`,
                    `          = ${fmtMoney(subTotal)}`,
                  ]}
                />
                <FormulaBlock
                  lines={[
                    `AI = Sub Total ${TIMES} ROI% ${TIMES} (Tenor ${DIVIDE} 365)`,
                    `   = ${fmtMoney(subTotal)} ${TIMES} ${fmtRoi(roiPercent)} ${TIMES} (${fmtTenor(tenorDays)} ${DIVIDE} 365)`,
                    `   = ${fmtMoney(amounts.advanceInterest)}`,
                  ]}
                />
                <FormulaBlock
                  last
                  lines={[
                    `NDA = Sub Total ${MINUS} TDS ${MINUS} AI`,
                    `    = ${fmtMoney(subTotal)} ${MINUS} ${fmtMoney(amounts.tdsAmount)} ${MINUS} ${fmtMoney(amounts.advanceInterest)}`,
                    `    = ${fmtMoney(nda)}`,
                  ]}
                />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

function FormulaBlock({
  lines,
  last,
}: {
  lines: string[];
  last?: boolean;
}) {
  return (
    <View style={[styles.block, last && styles.blockLast]}>
      {lines.map((line, index) => {
        const isResult = index === lines.length - 1;
        return (
          <Text
            key={`${index}-${line}`}
            style={[
              styles.line,
              index === 0 && styles.lineTitle,
              isResult && styles.lineResult,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            selectable>
            {line}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '90%',
    maxWidth: 420,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
    lineHeight: 24,
  },
  scroll: {
    maxHeight: 420,
  },
  content: {
    padding: 16,
  },
  block: {
    marginBottom: 16,
  },
  blockLast: {
    marginBottom: 0,
  },
  line: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  lineTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  lineResult: {
    fontWeight: '600',
  },
});
