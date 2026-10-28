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

  computeInvoiceSubTotalAfterTds,

  computeInvoiceTaxableBase,

  computeInvoiceNetTotal,

  formatIndianCurrency,

  round2,

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

  /** When set, AI principal is Financed Amount (F), not DRA. */
  marginPercent?: number | string | null;

  marginDeduction?: number | string | null;

  financedAmount?: number | string | null;

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

  const invoiceAmount = computeInvoiceTaxableBase(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
  );

  const requestedAmount = computeInvoiceSubTotalAfterTds(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
    amounts.tdsAmount,
  );

  const roiPercent = Number(amounts.roiPercent) || 0;
  const tenorDays = Number(amounts.tenorDays) || 0;
  const financedRaw = Number(amounts.financedAmount);
  const marginPct = Number(amounts.marginPercent) || 0;
  const marginDeductionRaw = Number(amounts.marginDeduction);
  const hasFinanced =
    Number.isFinite(financedRaw) && financedRaw > 0;
  const financedAmount = hasFinanced
    ? round2(financedRaw)
    : requestedAmount;
  const marginDeduction = hasFinanced
    ? Number.isFinite(marginDeductionRaw) && marginDeductionRaw >= 0
      ? round2(marginDeductionRaw)
      : round2(Math.max(0, requestedAmount - financedAmount))
    : 0;

  // Prefer F-based rule (VF|SID Upfront): AI = F × ROI% × (Tenor ÷ 365).
  // Without F, fall back to DRA principal (legacy / screens without preview).
  const aiPrincipal = financedAmount;
  const calculatedAi =
    aiPrincipal > 0 && roiPercent > 0 && tenorDays > 0
      ? round2(aiPrincipal * (roiPercent / 100) * (tenorDays / 365))
      : 0;
  const nda = round2(Math.max(0, aiPrincipal - calculatedAi));
  const principalLabel = hasFinanced ? 'F' : 'DRA';

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
                    `Invoice Amount = Basic ${MINUS} Discount + GST`,
                    `          = ${fmtMoney(amounts.basicAmount)} ${MINUS} ${fmtMoney(amounts.discount)} + ${fmtMoney(amounts.gstAmount)}`,
                    `          = ${fmtMoney(invoiceAmount)}`,
                    `DRA = Invoice Amount ${MINUS} TDS`,
                    `    = ${fmtMoney(invoiceAmount)} ${MINUS} ${fmtMoney(amounts.tdsAmount)}`,
                    `    = ${fmtMoney(requestedAmount)}`,
                  ]}
                />
                {hasFinanced ? (
                  <FormulaBlock
                    lines={[
                      marginPct > 0
                        ? `Margin Deduction (${marginPct}%) = DRA ${MINUS} F`
                        : `Margin Deduction = DRA ${MINUS} F`,
                      `                 = ${fmtMoney(requestedAmount)} ${MINUS} ${fmtMoney(financedAmount)}`,
                      `                 = ${fmtMoney(marginDeduction)}`,
                      `F = Financed Amount = ${fmtMoney(financedAmount)}`,
                    ]}
                  />
                ) : null}
                <FormulaBlock
                  lines={[
                    `AI = ${principalLabel} ${TIMES} ROI% ${TIMES} (Tenor ${DIVIDE} 365)`,
                    `   = ${fmtMoney(aiPrincipal)} ${TIMES} ${fmtRoi(roiPercent)} ${TIMES} (${fmtTenor(tenorDays)} ${DIVIDE} 365)`,
                    `   = ${fmtMoney(calculatedAi)}`,
                  ]}
                />
                <FormulaBlock
                  last
                  lines={[
                    `NDA = ${principalLabel} ${MINUS} AI`,
                    `    = ${fmtMoney(aiPrincipal)} ${MINUS} ${fmtMoney(calculatedAi)}`,
                    `    = ${fmtMoney(nda)}`,
                  ]}
                />
                <Text style={styles.legendFirst}>
                  DRA = Disbursement Requested Amount
                </Text>
                {hasFinanced ? (
                  <Text style={styles.legend}>F = Financed Amount</Text>
                ) : null}
                <Text style={styles.legend}>AI = Advance Interest</Text>
                <Text style={styles.legend}>NDA = Net Disbursement Amount</Text>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};



export type InvoiceSummaryFormulaAmounts = {
  basicAmount: number;
  discount: number;
  gstAmount: number;
  tdsAmount?: number;
  advanceInterest?: number;
  financedAmount?: number;
};

type SummaryFormulaModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  lines: string[];
};

const SummaryFormulaModal: React.FC<SummaryFormulaModalProps> = ({
  visible,
  onClose,
  title,
  lines,
}) => (
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
              <Text style={styles.title}>{title}</Text>
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
              <FormulaBlock last lines={lines} />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

export const InvoiceAmountFormulaModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  amounts: Pick<
    InvoiceSummaryFormulaAmounts,
    'basicAmount' | 'discount' | 'gstAmount'
  >;
}> = ({visible, onClose, amounts}) => {
  const invoiceAmount = computeInvoiceTaxableBase(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
  );

  return (
    <SummaryFormulaModal
      visible={visible}
      onClose={onClose}
      title="Invoice Amount"
      lines={[
        `Invoice Amount = Basic ${MINUS} Discount + GST`,
        `          = ${fmtMoney(amounts.basicAmount)} ${MINUS} ${fmtMoney(amounts.discount)} + ${fmtMoney(amounts.gstAmount)}`,
        `          = ${fmtMoney(invoiceAmount)}`,
      ]}
    />
  );
};

export const DisbursementRequestedFormulaModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  amounts: InvoiceSummaryFormulaAmounts;
}> = ({visible, onClose, amounts}) => {
  const invoiceAmount = computeInvoiceTaxableBase(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
  );
  const requestedAmount = computeInvoiceSubTotalAfterTds(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
    amounts.tdsAmount ?? 0,
  );

  return (
    <SummaryFormulaModal
      visible={visible}
      onClose={onClose}
      title="Disbursement Requested Amount"
      lines={[
        `DRA = Invoice Amount ${MINUS} TDS`,
        `    = ${fmtMoney(invoiceAmount)} ${MINUS} ${fmtMoney(amounts.tdsAmount ?? 0)}`,
        `    = ${fmtMoney(requestedAmount)}`,
      ]}
    />
  );
};

export const NetDisbursementFormulaModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  amounts: InvoiceSummaryFormulaAmounts;
}> = ({visible, onClose, amounts}) => {
  const requestedAmount = computeInvoiceSubTotalAfterTds(
    amounts.basicAmount,
    amounts.discount,
    amounts.gstAmount,
    amounts.tdsAmount ?? 0,
  );
  const advanceInterest = amounts.advanceInterest ?? 0;
  const financedRaw = Number(amounts.financedAmount);
  const hasFinanced = Number.isFinite(financedRaw) && financedRaw > 0;
  const principal = hasFinanced ? round2(financedRaw) : requestedAmount;
  const netAmount = hasFinanced
    ? round2(Math.max(0, principal - advanceInterest))
    : computeInvoiceNetTotal(
        amounts.basicAmount,
        amounts.discount,
        amounts.gstAmount,
        amounts.tdsAmount ?? 0,
        advanceInterest,
      );

  return (
    <SummaryFormulaModal
      visible={visible}
      onClose={onClose}
      title="Net Disbursement Amount"
      lines={
        hasFinanced
          ? [
              `NDA = Financed Amount ${MINUS} Advance Interest`,
              `    = ${fmtMoney(principal)} ${MINUS} ${fmtMoney(advanceInterest)}`,
              `    = ${fmtMoney(netAmount)}`,
            ]
          : [
              `NDA = Disbursement Requested Amount ${MINUS} Advance Interest`,
              `    = ${fmtMoney(requestedAmount)} ${MINUS} ${fmtMoney(advanceInterest)}`,
              `    = ${fmtMoney(netAmount)}`,
            ]
      }
    />
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

            minimumFontScale={0.85}

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

    width: '94%',

    maxWidth: 440,

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

    fontSize: 12,

    color: '#333',

    lineHeight: 18,

    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',

  },

  lineTitle: {

    fontSize: 12,

    fontWeight: '700',

    marginBottom: 4,

  },

  lineResult: {

    fontSize: 12,

    fontWeight: '700',

  },

  legendFirst: {

    marginTop: 10,

    fontSize: 11,

    lineHeight: 16,

    color: '#666',

  },

  legend: {

    marginTop: 2,

    fontSize: 11,

    lineHeight: 16,

    color: '#666',

  },

});


