import React, {useState, useEffect, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Keyboard,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {DateNTimePicker, CustomDropdown} from '@components/index';
import Toast from 'react-native-toast-message';
import {invoiceApi} from '@services/api/invoice.api';
import {decryptValue} from '@utils/decrypt';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {
  computeDisbursementPreviewAmounts,
  isVfUpfrontChargeType,
  resolveDisbursementUsanceDaysDisplay,
} from '@utils/invoiceTotals';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = WINDOW_HEIGHT * 0.96;

type BulkMarkAsDisbursedModalProps = {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
  selectedInvoices: {
    id: string;
    invoiceNo: string;
    amount: number;
    invoiceDateRaw?: string | null;
    productName?: string;
  }[];
  onSubmit: (data: BulkDisbursementSubmitRow[]) => void | Promise<void>;
};

export type BulkDisbursementSubmitRow = {
  id: string;
  invoiceNo: string;
  amount: number;
  debitFrom: string;
  creditTo: string;
  status: string;
  disbursedAmount: string;
  date: string;
  utrNo: string;
  transactionNo: string;
  remark: string;
  holdCategory: string;
  expectedReleaseDate: string;
  invoiceDateRaw?: string | null;
  usanceDays?: number;
  upfrontInterest?: number;
};

/** Invoice calendar day + 1 through today (no future dates). */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfToday(): Date {
  const x = new Date();
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseInvoiceCalendarDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function getMinDisbursementDate(invoiceDateRaw?: string | null): Date {
  const today = startOfDay(new Date());
  const inv = parseInvoiceCalendarDate(invoiceDateRaw);
  if (!inv) return today;
  const min = new Date(inv);
  min.setDate(min.getDate() + 1);
  return startOfDay(min);
}

function getMaxDisbursementDate(): Date {
  return endOfToday();
}

function formatDdMmYyyy(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function parseDdMmYyyy(value: string): Date | null {
  const parts = (value || '').split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return startOfDay(d);
}

function isDisbursementDateAllowed(selected: Date, invoiceDateRaw?: string | null): boolean {
  const min = getMinDisbursementDate(invoiceDateRaw);
  const max = getMaxDisbursementDate();
  const sel = startOfDay(selected);
  return sel.getTime() >= min.getTime() && sel.getTime() <= startOfDay(max).getTime();
}

const statusOptions = [
  {label: 'Disbursed', value: 'Disbursed'},
  {label: 'Hold', value: 'Hold'},
  {label: 'Reject', value: 'Reject'},
];

const holdCategoryOptions = [
  {label: 'Verification Pending', value: 'Verification Pending'},
  {label: 'Insufficient Funds', value: 'Insufficient Funds'},
  {label: 'KYC Issue', value: 'KYC Issue'},
  {label: 'Other', value: 'Other'},
];

type InvoiceRowData = BulkDisbursementSubmitRow & {
  invoicePreview?: Record<string, unknown> | null;
  isVendorFinance?: boolean;
  isVfUpfront?: boolean;
};

function isVendorFinanceProduct(productName?: string): boolean {
  return String(productName || '').toLowerCase().includes('vendor');
}

function buildInvoicePreview(invoiceData: Record<string, unknown>, bankData: Record<string, unknown>) {
  const apm = (invoiceData.anchorParticipantMapping ?? {}) as Record<string, unknown>;
  const program = (invoiceData.program ?? {}) as Record<string, unknown>;
  const productConfig = (program.productConfig ?? {}) as Record<string, unknown>;
  const interestParams = (apm.interest_parameters ?? {}) as Record<string, unknown>;
  return {
    ...invoiceData,
    eligibility_percent:
      apm.eligibility ?? (program as {eligibility?: unknown}).eligibility ?? null,
    interest_charge_type: productConfig.interest_charge_type ?? null,
    interest_rate_percent:
      invoiceData.total_roi_percent ?? interestParams.total_roi_percent ?? null,
    transaction_interest_rate:
      bankData.interest_rate ?? bankData.interestRate ?? null,
  };
}

function applyDisbursementCalc(
  row: InvoiceRowData,
  disbursementDate: string,
): Pick<InvoiceRowData, 'disbursedAmount' | 'usanceDays' | 'upfrontInterest'> {
  if (row.status !== 'Disbursed' || !disbursementDate.trim()) {
    return {disbursedAmount: '', usanceDays: undefined, upfrontInterest: undefined};
  }
  const amounts = computeDisbursementPreviewAmounts(row.invoicePreview, {
    disbursementDate,
    isVendorFinance: row.isVendorFinance,
    isVfUpfront: row.isVfUpfront,
  });
  return {
    disbursedAmount:
      amounts.disbursedAmount > 0 ? formatAmount(amounts.disbursedAmount) : '',
    usanceDays: amounts.usanceDays,
    upfrontInterest: amounts.advanceInterest,
  };
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

export const BulkMarkAsDisbursedModal: React.FC<BulkMarkAsDisbursedModalProps> = ({
  visible,
  onClose,
  isLoading = false,
  selectedInvoices,
  onSubmit,
}) => {
  const [rows, setRows] = useState<InvoiceRowData[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [accountsLoading, setAccountsLoading] = useState(false);

  useEffect(() => {
    if (!visible || selectedInvoices.length === 0) {
      setCheckedIds(new Set());
      return;
    }

    setCheckedIds(new Set(selectedInvoices.map(inv => inv.id)));

    const initRows: InvoiceRowData[] = selectedInvoices.map(inv => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      amount: inv.amount,
      invoiceDateRaw: inv.invoiceDateRaw ?? null,
      debitFrom: 'Loading...',
      creditTo: 'Loading...',
      status: 'Disbursed',
      disbursedAmount: '',
      date: '',
      utrNo: '',
      transactionNo: '',
      remark: '',
      holdCategory: '',
      expectedReleaseDate: '',
      isVendorFinance: isVendorFinanceProduct(inv.productName),
      isVfUpfront: false,
      invoicePreview: null,
    }));
    setRows(initRows);
    setAccountsLoading(true);

    Promise.all(
      selectedInvoices.map(async inv => {
        try {
          const [bankRes, invoiceRes] = await Promise.all([
            invoiceApi.getBankAccountsForDisbursement(inv.id),
            invoiceApi.getInvoiceDetails(inv.id),
          ]);
          const bankPayload = bankRes?.data ?? bankRes ?? {};
          const invoiceData = (invoiceRes ?? {}) as Record<string, unknown>;
          const d = bankPayload as Record<string, unknown>;

          let debitFrom = '';
          let creditTo = '';

          const apm = d?.anchorParticipantMapping ?? d?.anchor_participant_mapping;
          const apmObj = (Array.isArray(apm) ? apm[0] : apm) as Record<string, unknown> | undefined;
          const odAccount = apmObj?.od_account_no ?? apmObj?.odAccountNo ?? '';
          const party = apmObj?.party as Record<string, unknown> | undefined;
          const entityName = party?.entity_name ?? apmObj?.Party?.entityName ?? '';
          if (odAccount) {
            const decryptedOd = decryptValue(String(odAccount));
            debitFrom = entityName ? `${decryptedOd} (${entityName})` : decryptedOd;
          }

          const pvd = (invoiceData.programVendorDetails ??
            invoiceData.program_vendor_details) as
            | {vendor_name?: string; vendor_code?: string}
            | undefined;
          const invoiceProgram = invoiceData.program as
            | {basic_parameters?: {loan_account_no?: string}}
            | undefined;
          const programLoan = invoiceProgram?.basic_parameters?.loan_account_no;
          if (!debitFrom && programLoan) {
            const decryptedOd = decryptValue(String(programLoan)) || String(programLoan);
            const vendorName = pvd?.vendor_name
              ? decryptValue(String(pvd.vendor_name)) || String(pvd.vendor_name)
              : '';
            debitFrom = vendorName ? `${decryptedOd} (${vendorName})` : decryptedOd;
          }

          const program = (d?.program ?? d?.Program) as Record<string, unknown> | undefined;
          const programBankDetails = (program?.bank_details ?? []) as Array<Record<string, unknown>>;
          const programAcc =
            programBankDetails.length > 0
              ? programBankDetails[0]?.account_number ?? programBankDetails[0]?.accountNumber ?? ''
              : '';
          if (programAcc) {
            creditTo = decryptValue(String(programAcc));
          }
          if (!creditTo) {
            const creditAcc = (invoiceData.creditToBankAccount ??
              invoiceData.credit_to_bank_account) as
              | {accountNumber?: string; account_number?: string}
              | undefined;
            const accNo = creditAcc?.accountNumber ?? creditAcc?.account_number ?? '';
            if (accNo) {
              creditTo = decryptValue(String(accNo)) || String(accNo);
            }
          }

          const preview = buildInvoicePreview(invoiceData, d);
          const programConfig = (invoiceData.program as {productConfig?: {interest_charge_type?: string}} | undefined)
            ?.productConfig;
          const isVendorFinance =
            inv.productName != null
              ? isVendorFinanceProduct(inv.productName)
              : isVendorFinanceProduct(
                  String((programConfig as {product?: {name?: string}} | undefined)?.product?.name ?? ''),
                );
          const isVfUpfront =
            isVendorFinance &&
            isVfUpfrontChargeType(programConfig?.interest_charge_type ?? preview.interest_charge_type as string);

          return {
            id: inv.id,
            debitFrom: debitFrom || '-',
            creditTo: creditTo || '-',
            invoicePreview: preview,
            isVendorFinance,
            isVfUpfront,
          };
        } catch {
          return {
            id: inv.id,
            debitFrom: 'N/A',
            creditTo: 'N/A',
            invoicePreview: null,
            isVendorFinance: isVendorFinanceProduct(inv.productName),
            isVfUpfront: false,
          };
        }
      }),
    ).then(results => {
      setRows(prev =>
        prev.map(r => {
          const match = results.find(res => res.id === r.id);
          return match
            ? {
                ...r,
                debitFrom: match.debitFrom,
                creditTo: match.creditTo,
                invoicePreview: match.invoicePreview,
                isVendorFinance: match.isVendorFinance,
                isVfUpfront: match.isVfUpfront,
              }
            : r;
        }),
      );
      setAccountsLoading(false);
    });
  }, [visible, selectedInvoices]);

  const updateRow = useCallback((id: string, field: keyof InvoiceRowData, value: string) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        let next: InvoiceRowData = {...r, [field]: value} as InvoiceRowData;
        if (field === 'status') {
          if (value !== 'Disbursed') {
            next.utrNo = '';
            next.transactionNo = '';
            next.date = '';
            next.disbursedAmount = '';
            next.usanceDays = undefined;
            next.upfrontInterest = undefined;
          }
          if (value !== 'Hold') {
            next.holdCategory = '';
            next.expectedReleaseDate = '';
          }
        }
        if (field === 'date' && next.status === 'Disbursed') {
          next = {...next, ...applyDisbursementCalc(next, value)};
        }
        return next;
      }),
    );
  }, []);

  const toggleChecked = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allChecked = rows.length > 0 && rows.every(r => checkedIds.has(r.id));

  const handleToggleSelectAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(rows.map(r => r.id)));
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    const rowsToSubmit = rows.filter(r => checkedIds.has(r.id));
    if (rowsToSubmit.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Select at least one invoice to submit',
      });
      return;
    }

    for (const row of rowsToSubmit) {
      if (!row.status) {
        Toast.show({type: 'error', text1: `Status is required for ${row.invoiceNo}`});
        return;
      }
      if (row.status === 'Disbursed') {
        if (!row.date) {
          Toast.show({type: 'error', text1: `Date is required for ${row.invoiceNo}`});
          return;
        }
        const picked = parseDdMmYyyy(row.date);
        const minD = getMinDisbursementDate(row.invoiceDateRaw);
        const maxD = getMaxDisbursementDate();
        if (!picked || !isDisbursementDateAllowed(picked, row.invoiceDateRaw)) {
          Toast.show({
            type: 'error',
            text1: `Date for ${row.invoiceNo} must be between ${formatDdMmYyyy(minD)} and ${formatDdMmYyyy(maxD)}`,
          });
          return;
        }
        if (!row.utrNo.trim()) {
          Toast.show({type: 'error', text1: `UTR No is required for ${row.invoiceNo}`});
          return;
        }
        if (!row.transactionNo.trim()) {
          Toast.show({type: 'error', text1: `Transaction No is required for ${row.invoiceNo}`});
          return;
        }
        if (!row.disbursedAmount.trim()) {
          Toast.show({type: 'error', text1: `Disbursed amount is required for ${row.invoiceNo}`});
          return;
        }
      }
      if (row.status === 'Hold') {
        if (!row.holdCategory) {
          Toast.show({type: 'error', text1: `Hold category is required for ${row.invoiceNo}`});
          return;
        }
        if (!row.expectedReleaseDate) {
          Toast.show({type: 'error', text1: `Expected release date is required for ${row.invoiceNo}`});
          return;
        }
      }
      if (row.status === 'Reject' && !row.remark.trim()) {
        Toast.show({type: 'error', text1: `Remark is required for rejected invoice ${row.invoiceNo}`});
        return;
      }
    }

    await onSubmit(
      rowsToSubmit.map(
        ({invoicePreview: _p, isVendorFinance: _vf, isVfUpfront: _vu, ...rest}) => rest,
      ),
    );
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const checkedRows = rows.filter(r => checkedIds.has(r.id));
  const checkedCount = checkedRows.length;
  const checkedTotal = checkedRows.reduce((sum, r) => sum + r.amount, 0);

  const renderReadOnlyField = (label: string, value: string) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyText} numberOfLines={3}>
          {value || '-'}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Bulk Disbursement</Text>
              <Text style={styles.subtitle}>Verify disbursement details for below invoices.</Text>
              <Text style={styles.countLine}>
                {checkedCount} of {rows.length} selected · Total ₹ {formatAmount(checkedTotal)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
              <FontAwesome6 name="xmark" iconStyle="solid" size={18} color={Colors.graybase} />
            </TouchableOpacity>
          </View>

          {rows.length > 1 && (
            <TouchableOpacity
              style={styles.selectAllRow}
              activeOpacity={0.8}
              onPress={handleToggleSelectAll}>
              <View style={[styles.checkbox, allChecked && styles.checkboxSelected]}>
                {allChecked && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.selectAllText}>Select all</Text>
            </TouchableOpacity>
          )}

          {accountsLoading && (
            <View style={styles.loadingBar}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Loading account details…</Text>
            </View>
          )}

          <View style={styles.listWrapper}>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled>
            {rows.map((row, index) => {
              const isChecked = checkedIds.has(row.id);
              return (
              <View
                key={row.id}
                style={[styles.card, !isChecked && styles.cardUnchecked]}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  activeOpacity={0.8}
                  onPress={() => toggleChecked(row.id)}>
                  <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                    {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {row.invoiceNo}
                  </Text>
                </TouchableOpacity>

                {!isChecked ? (
                  <Text style={styles.uncheckedHint}>
                    Excluded from submit — tap checkbox above to include
                  </Text>
                ) : (
                <>
                <View style={styles.readOnlyRow}>
                  {renderReadOnlyField('Invoice Amount', formatAmount(row.amount))}
                  {renderReadOnlyField('Debit From', row.debitFrom)}
                </View>
                {renderReadOnlyField('Credit To', row.creditTo)}

                <View style={styles.divider} />

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    Status <Text style={styles.required}>*</Text>
                  </Text>
                  <CustomDropdown
                    label=""
                    data={statusOptions}
                    value={row.status}
                    onChange={val => updateRow(row.id, 'status', val)}
                    placeholder="Select status"
                    containerStyle={styles.dropdownReset}
                    showSearch={false}
                  />
                </View>

                {row.status === 'Disbursed' && (
                  <>
                    {row.isVfUpfront && row.date ? (
                      renderReadOnlyField(
                        'Usance Days',
                        resolveDisbursementUsanceDaysDisplay(
                          row.usanceDays ?? null,
                          String(row.invoicePreview?.invoice_due_date ?? row.invoicePreview?.due_date ?? ''),
                          row.date,
                          row.invoicePreview?.tenor ?? row.invoicePreview?.tenor_days ?? null,
                        ),
                      )
                    ) : null}
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>
                        Disbursed Amount <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={row.disbursedAmount}
                        onChangeText={val => updateRow(row.id, 'disbursedAmount', val)}
                        placeholder="Amount"
                        keyboardType="numeric"
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>
                        Date <Text style={styles.required}>*</Text>
                      </Text>
                      <Text style={styles.dateHint}>
                        Select {formatDdMmYyyy(getMinDisbursementDate(row.invoiceDateRaw))} to{' '}
                        {formatDdMmYyyy(getMaxDisbursementDate())} (no future dates)
                      </Text>
                      <DateNTimePicker
                        label=""
                        mode="date"
                        value={row.date}
                        onConfirm={(selectedDate: Date) => {
                          if (!isDisbursementDateAllowed(selectedDate, row.invoiceDateRaw)) {
                            const minD = getMinDisbursementDate(row.invoiceDateRaw);
                            const maxD = getMaxDisbursementDate();
                            Toast.show({
                              type: 'error',
                              text1: `Date must be between ${formatDdMmYyyy(minD)} and ${formatDdMmYyyy(maxD)}`,
                            });
                            return;
                          }
                          updateRow(row.id, 'date', formatDdMmYyyy(selectedDate));
                        }}
                        placeholder="DD-MM-YYYY"
                        containerStyle={styles.dropdownReset}
                        datePickerProps={{
                          minimumDate: getMinDisbursementDate(row.invoiceDateRaw),
                          maximumDate: getMaxDisbursementDate(),
                        }}
                      />
                    </View>
                    <View style={styles.fieldRow}>
                      <View style={[styles.fieldBlock, styles.fieldHalf]}>
                        <Text style={styles.fieldLabel}>
                          UTR No <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={row.utrNo}
                          onChangeText={val => updateRow(row.id, 'utrNo', val)}
                          placeholder="UTR No"
                          placeholderTextColor={Colors.graybase}
                        />
                      </View>
                      <View style={[styles.fieldBlock, styles.fieldHalf]}>
                        <Text style={styles.fieldLabel}>
                          Transaction No <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={row.transactionNo}
                          onChangeText={val => updateRow(row.id, 'transactionNo', val)}
                          placeholder="Transaction No"
                          placeholderTextColor={Colors.graybase}
                        />
                      </View>
                    </View>
                  </>
                )}

                {row.status === 'Hold' && (
                  <>
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>
                        Hold Category <Text style={styles.required}>*</Text>
                      </Text>
                      <CustomDropdown
                        label=""
                        data={holdCategoryOptions}
                        value={row.holdCategory}
                        onChange={val => updateRow(row.id, 'holdCategory', val)}
                        placeholder="Select category"
                        containerStyle={styles.dropdownReset}
                        showSearch={false}
                      />
                    </View>
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>
                        Expected Release Date <Text style={styles.required}>*</Text>
                      </Text>
                      <DateNTimePicker
                        label=""
                        mode="date"
                        value={row.expectedReleaseDate}
                        onConfirm={(selectedDate: Date) => {
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const year = selectedDate.getFullYear();
                          updateRow(row.id, 'expectedReleaseDate', `${day}-${month}-${year}`);
                        }}
                        placeholder="DD-MM-YYYY"
                        containerStyle={styles.dropdownReset}
                      />
                    </View>
                  </>
                )}

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    Remark
                    {row.status === 'Reject' ? <Text style={styles.required}> *</Text> : null}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.remarkInput]}
                    value={row.remark}
                    onChangeText={val => updateRow(row.id, 'remark', val)}
                    placeholder="Remark"
                    multiline
                    placeholderTextColor={Colors.graybase}
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                </>
                )}
              </View>
            );
            })}
          </ScrollView>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.cancelBtn]}
              onPress={handleClose}
              disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerBtn,
                styles.submitBtn,
                (isLoading || checkedCount === 0) && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || checkedCount === 0}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Submit</Text>
                  <FontAwesome6 name="check" iconStyle="solid" size={14} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(16),
    borderTopRightRadius: scaleWidth(16),
    height: SHEET_HEIGHT,
    maxHeight: SHEET_HEIGHT,
    width: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  title: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  subtitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginTop: scaleHeight(4),
  },
  countLine: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    marginTop: scaleHeight(6),
  },
  closeBtn: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: Colors.white,
    gap: scaleWidth(10),
  },
  selectAllText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxCheck: {
    color: Colors.white,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
    lineHeight: scaleFont(12),
  },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    backgroundColor: '#F0F7FF',
  },
  loadingText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  listWrapper: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: scaleWidth(16),
    paddingBottom: scaleHeight(8),
    gap: scaleHeight(12),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: scaleWidth(14),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnchecked: {
    opacity: 0.65,
    backgroundColor: '#F9FAFB',
  },
  uncheckedHint: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    fontStyle: 'italic',
    marginTop: scaleHeight(4),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    gap: scaleWidth(10),
  },
  indexBadge: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
    color: Colors.primaryColor,
  },
  cardTitle: {
    flex: 1,
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  readOnlyRow: {
    flexDirection: 'row',
    gap: scaleWidth(10),
  },
  fieldBlock: {
    flex: 1,
    marginBottom: scaleHeight(10),
  },
  fieldHalf: {
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: scaleWidth(10),
  },
  fieldLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  dateHint: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
  },
  required: {
    color: Colors.red,
  },
  readOnlyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    minHeight: scaleHeight(40),
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: scaleHeight(4),
    marginBottom: scaleHeight(10),
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    backgroundColor: Colors.white,
    minHeight: scaleHeight(44),
  },
  remarkInput: {
    minHeight: scaleHeight(72),
    textAlignVertical: 'top',
  },
  dropdownReset: {
    marginBottom: 0,
    marginTop: 0,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(14),
    paddingBottom: Platform.OS === 'ios' ? scaleHeight(28) : scaleHeight(16),
    gap: scaleWidth(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: Colors.white,
  },
  footerBtn: {
    flex: 1,
    height: scaleHeight(48),
    borderRadius: scaleWidth(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  submitBtn: {
    backgroundColor: Colors.green,
  },
  submitDisabled: {
    backgroundColor: Colors.graybase,
  },
  submitBtnText: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
