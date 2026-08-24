import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {selectDealerInfo} from '@store/invoice/inv.selector';
import {AppBar, Container, InvoiceStatusBadges} from '@components/index';
import {AdvanceInterestFormulaModal} from '@components/AdvanceInterestFormulaModal';
import {InvoiceAccountingSummary} from '@components/InvoiceAccountingSummary';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {decryptValue} from '@utils/decrypt';
import type {AdvanceInterestBreakdown} from '@utils/invoiceTotals';
import type {InvoiceFields} from '@type/Invoice';

const fmtAmount = (n: number) =>
  n.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

const displayOrDash = (value?: string | number | null) => {
  if (value === null || value === undefined) return '-';
  const text = String(value).trim();
  return text.length ? text : '-';
};

type AttachmentItem = {id: number; attachment_url: string; fullUrl: string};

type PreviewLineItem = {
  id: string;
  itemName: string;
  quantity: number;
  unit: number | string;
  price: number;
  total: number;
  lineTotal: number;
  discountAmount: number;
  taxAmount: number;
};

type InvoiceDetailData = {
  counterPartyName: string;
  counterPartyCode: string;
  odAccountNumber: string;
  anchorName: string;
  creditTo: string;
  remark: string;
  poRefNo: string;
  invoiceDate: string;
  invoiceDueDate: string;
  paymentDate: string;
  grnDate: string;
  tenor: string;
  earlyPaymentDiscount: string;
  items: PreviewLineItem[];
  discount: {percent: number; amount: number};
  tax: {percent: number; amount: number};
  subTotal: number;
  tdsAmount: number;
  advanceInterest: number;
  total: number;
  attachments: AttachmentItem[];
};

const mapPreviewFieldsToInvoiceData = (
  fields: InvoiceFields,
  attachment?: DocumentPickerResponse,
  partyNames?: {
    anchorName?: string;
    counterPartyName?: string;
    counterPartyCode?: string;
  },
): InvoiceDetailData => {
  const normalizedItems: PreviewLineItem[] = (fields.items || []).map(
    (it: any, index) => {
      const lineTotal = Number(it.total) || 0;
      const discountType = it.discountType || '';
      const discountValue = Number(it.discountValue) || 0;
      let discountAmount = Number(it.discountAmount) || 0;
      if (!discountAmount && discountType === 'percentage') {
        discountAmount = (lineTotal * discountValue) / 100;
      } else if (!discountAmount && discountType === 'value') {
        discountAmount = discountValue;
      }
      const taxes = Array.isArray(it.taxes) ? it.taxes : [];
      const taxFromTaxes = taxes.reduce(
        (sum: number, t: any) => sum + (Number(t?.taxAmount) || 0),
        0,
      );
      const taxAmount = taxFromTaxes || Number(it.taxAmount) || 0;
      const netTotal = Math.max(0, lineTotal - discountAmount + taxAmount);
      return {
        id: `preview-item-${index}`,
        itemName: it.itemName || '-',
        quantity: Number(it.quantity) || 0,
        unit: it.unit || '-',
        price: Number(it.pricePerQuantity) || 0,
        total: netTotal,
        lineTotal,
        discountAmount,
        taxAmount,
      };
    },
  );

  const subTotalBeforeDiscountTax = normalizedItems.reduce(
    (sum, it) => sum + (Number(it.lineTotal) || 0),
    0,
  );
  const itemDiscountTotal = normalizedItems.reduce(
    (sum, it) => sum + (Number(it.discountAmount) || 0),
    0,
  );
  const itemTaxTotal = normalizedItems.reduce(
    (sum, it) => sum + (Number(it.taxAmount) || 0),
    0,
  );

  const formDiscountValue = Number(fields.discountValue) || 0;
  const discountAmount =
    itemDiscountTotal ||
    (fields.discountType === 'percentage'
      ? (subTotalBeforeDiscountTax * formDiscountValue) / 100
      : formDiscountValue);

  const formTaxTotal = (Number(fields.cgst) || 0) + (Number(fields.sgst) || 0);
  const taxAmount = itemTaxTotal || formTaxTotal;

  const subTotal = subTotalBeforeDiscountTax;
  const tdsAmount = Number(fields.tdsAmount) || 0;
  const advanceInterest = Number(fields.upfrontInterest) || 0;
  // grandTotal from create already includes AI deduct (web Create parity).
  const total =
    Number(fields.grandTotal) ||
    subTotalBeforeDiscountTax - discountAmount + taxAmount - tdsAmount - advanceInterest;

  const discountPercent =
    subTotalBeforeDiscountTax > 0
      ? (discountAmount / subTotalBeforeDiscountTax) * 100
      : 0;
  const taxPercent =
    subTotalBeforeDiscountTax > 0
      ? (taxAmount / subTotalBeforeDiscountTax) * 100
      : 0;

  const fallbackCounterParty =
    decryptValue(fields.dealer ?? '') || fields.dealer || '';
  const fallbackCode = fields.dealerCode || '';

  return {
    counterPartyName: partyNames?.counterPartyName?.trim() || fallbackCounterParty,
    counterPartyCode: partyNames?.counterPartyCode?.trim() || fallbackCode,
    odAccountNumber:
      decryptValue(fields.odAccountNumber ?? '') || fields.odAccountNumber || '',
    anchorName: partyNames?.anchorName?.trim() || '',
    creditTo: fields.creditTo || '',
    remark: fields.remark || '',
    poRefNo: fields.associatedPO || '',
    invoiceDate: fields.invoiceDate || '',
    invoiceDueDate: fields.invoiceDueDate || '',
    paymentDate: fields.paymentDate || '',
    grnDate: fields.grnDate || '',
    tenor: fields.tenor || '',
    earlyPaymentDiscount: fields.earlyPaymentDiscount || '',
    items: normalizedItems,
    discount: {percent: discountPercent, amount: discountAmount},
    tax: {percent: taxPercent, amount: taxAmount},
    subTotal,
    tdsAmount,
    advanceInterest,
    total,
    attachments: attachment?.uri
      ? [
          {
            id: 0,
            attachment_url: attachment.name || 'Uploaded invoice',
            fullUrl: attachment.uri,
          },
        ]
      : (fields.attachments || []).map(att => ({
          id: att.id,
          attachment_url: att.attachment_url,
          fullUrl: att.attachment_url,
        })),
  };
};

const KeyValueRow = ({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={isLast ? styles.keyValueRowLast : styles.keyValueRow}>
    <View style={styles.keyLabelRow}>
      <Text style={styles.keyLabel}>{label}</Text>
    </View>
    <Text style={styles.keyValue}>{value}</Text>
  </View>
);

export const InvoiceUploadPreview: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const dealerInfo = useSelector(selectDealerInfo);

  const previewFields = route?.params?.previewFields as InvoiceFields | undefined;
  const previewAttachment = route?.params?.previewAttachment as
    | DocumentPickerResponse
    | undefined;
  const previewAnchorName = route?.params?.previewAnchorName as string | undefined;
  const previewCounterPartyName = route?.params?.previewCounterPartyName as
    | string
    | undefined;
  const previewCounterPartyCode = route?.params?.previewCounterPartyCode as
    | string
    | undefined;
  const productType =
    (route?.params?.productType as 'dealer_finance' | 'vendor_finance' | undefined) ||
    'dealer_finance';
  const isVendorFinance = productType === 'vendor_finance';
  const previewInvoiceStatus =
    (route?.params?.previewInvoiceStatus as string | undefined) || 'Draft';
  const previewApprovalStatus =
    (route?.params?.previewApprovalStatus as string | undefined) || '';
  // Web VF uses Counter Party; DF uses Dealer Name / Dealer Code.
  const counterPartyLabel = isVendorFinance ? 'Counter Party' : 'Dealer Name';
  const counterPartyCodeLabel = isVendorFinance
    ? 'Counter Party Code'
    : 'Dealer Code';
  const advanceInterestBreakdown = route?.params?.advanceInterestBreakdown as
    | AdvanceInterestBreakdown
    | null
    | undefined;
  const roiPercent = Number(route?.params?.roiPercent) || 0;
  const [showAdvanceInterestFormula, setShowAdvanceInterestFormula] =
    useState(false);

  const fallbackAnchorName =
    previewAnchorName ||
    (dealerInfo?.party?.entity_name
      ? decryptValue(dealerInfo.party.entity_name) || dealerInfo.party.entity_name
      : '');

  const invoiceData = useMemo(
    () =>
      mapPreviewFieldsToInvoiceData(
        previewFields || ({} as InvoiceFields),
        previewAttachment,
        {
          anchorName: fallbackAnchorName,
          counterPartyName: previewCounterPartyName,
          counterPartyCode: previewCounterPartyCode,
        },
      ),
    [
      previewFields,
      previewAttachment,
      fallbackAnchorName,
      previewCounterPartyName,
      previewCounterPartyCode,
    ],
  );

  const earlyPaymentDiscountDisplay = useMemo(() => {
    const raw = String(invoiceData.earlyPaymentDiscount || '').trim();
    if (!raw) return '-';
    return raw.includes('%') ? raw : `${raw}%`;
  }, [invoiceData.earlyPaymentDiscount]);

  const showAdvanceInterestRow =
    advanceInterestBreakdown?.chargeApplies ||
    invoiceData.advanceInterest > 0 ||
    isVendorFinance;

  const closePreview = () => {
    (navigation as any).navigate('CreateInvoice', {
      previewFields,
      previewAttachment,
      previewReturnToken: Date.now(),
    });
  };

  return (
    <Container>
      <AppBar
        title="Invoice Preview"
        navigation={navigation as any}
        hideHamburger
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.invoiceTitleContainer}>
            <Text style={styles.invoiceTitle}>
              Invoice / Unique Ref. No -{' '}
              {previewFields?.invoiceNumber?.trim() ||
                invoiceData.poRefNo ||
                'N/A'}
            </Text>
            <View style={styles.titleUnderline} />
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={closePreview}>
            <FontAwesome6
              name="xmark"
              iconStyle="solid"
              color={Colors.darkblack}
              size={scaleWidth(18)}
            />
          </TouchableOpacity>
        </View>
        <InvoiceStatusBadges
          invoiceStatus={previewInvoiceStatus}
          approvalStatus={previewApprovalStatus}
          mode="preview"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Party Details — web Create/Preview parity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Party Details</Text>
          <KeyValueRow
            label="Anchor"
            value={displayOrDash(invoiceData.anchorName)}
          />
          <KeyValueRow
            label="Loan OD Account Number"
            value={displayOrDash(invoiceData.odAccountNumber)}
          />
          <KeyValueRow
            label="Credit To"
            value={displayOrDash(invoiceData.creditTo)}
          />
          <KeyValueRow
            label={counterPartyLabel}
            value={displayOrDash(invoiceData.counterPartyName)}
          />
          <KeyValueRow
            label={counterPartyCodeLabel}
            value={displayOrDash(invoiceData.counterPartyCode)}
            isLast
          />
        </View>

        {/* Invoice Details — web Create/Preview parity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <KeyValueRow
            label="Invoice Date"
            value={displayOrDash(invoiceData.invoiceDate)}
          />
          <KeyValueRow
            label="Invoice Due Date"
            value={displayOrDash(invoiceData.invoiceDueDate)}
          />
          <KeyValueRow
            label="Payment Date"
            value={displayOrDash(invoiceData.paymentDate)}
          />
          <KeyValueRow
            label="GRN Date"
            value={displayOrDash(invoiceData.grnDate)}
          />
          <KeyValueRow label="Disbursement Date" value="-" />
          <KeyValueRow
            label="Po Ref No"
            value={displayOrDash(invoiceData.poRefNo)}
          />
          <KeyValueRow label="Tenor" value={displayOrDash(invoiceData.tenor)} />
          <KeyValueRow label="Usance Days" value="-" isLast />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <KeyValueRow
            label="Early Payment Discount"
            value={earlyPaymentDiscountDisplay}
          />
          <KeyValueRow
            label="Remark"
            value={displayOrDash(invoiceData.remark)}
            isLast
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          {invoiceData.items.length === 0 ? (
            <Text style={styles.emptyHint}>No items found</Text>
          ) : (
            invoiceData.items.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemHeaderText}>Item {index + 1}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Item Name:</Text>
                    <Text style={styles.itemDetailValue}>{item.itemName}</Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Quantity:</Text>
                    <Text style={styles.itemDetailValue}>{item.quantity}</Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Unit:</Text>
                    <Text style={styles.itemDetailValue}>{item.unit}</Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Price:</Text>
                    <Text style={styles.itemDetailValue}>
                      {fmtAmount(item.price)}
                    </Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Discount:</Text>
                    <Text style={styles.itemDetailValue}>
                      {item.discountAmount > 0
                        ? fmtAmount(item.discountAmount)
                        : '-'}
                    </Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Tax:</Text>
                    <Text style={styles.itemDetailValue}>
                      {item.taxAmount > 0 ? fmtAmount(item.taxAmount) : '-'}
                    </Text>
                  </View>
                  <View style={styles.itemDetailRowLast}>
                    <Text style={styles.itemDetailLabel}>Total:</Text>
                    <Text style={[styles.itemDetailValue, styles.itemTotalValue]}>
                      {fmtAmount(item.total)}/-
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <InvoiceAccountingSummary
            basicAmount={invoiceData.subTotal}
            discount={invoiceData.discount.amount}
            gstAmount={invoiceData.tax.amount}
            tdsAmount={invoiceData.tdsAmount}
            advanceInterest={
              advanceInterestBreakdown?.advanceInterest ??
              invoiceData.advanceInterest
            }
            netDisbursementAmount={invoiceData.total}
            showAdvanceInterest={showAdvanceInterestRow}
            onAdvanceInterestInfoPress={() =>
              setShowAdvanceInterestFormula(true)
            }
            amountSuffix="/-"
          />
        </View>

        <TouchableOpacity
          style={styles.closeFooterButton}
          onPress={closePreview}
          activeOpacity={0.8}>
          <Text style={styles.closeFooterButtonText}>Close</Text>
        </TouchableOpacity>

        {invoiceData.attachments.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.attachmentSectionTitle}>Attachments</Text>
            {invoiceData.attachments.map(att => {
              const fileName = att.attachment_url?.split('/').pop() || 'Attachment';
              const isPdf = fileName.toLowerCase().endsWith('.pdf');
              const isImage = /\.(png|jpe?g|webp|gif)$/i.test(fileName);

              return (
                <View key={att.id} style={styles.attachmentPreviewStatic}>
                  {isImage ? (
                    <Image
                      source={{uri: att.fullUrl}}
                      style={styles.previewAttachmentImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View
                      style={[styles.attachmentIcon, isPdf && styles.attachmentIconPdf]}>
                      <Text style={styles.attachmentIconText}>
                        {isPdf ? 'PDF' : 'FILE'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.attachmentInfo}>
                    <Text
                      style={styles.attachmentLabel}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {fileName}
                    </Text>
                    <Text style={styles.attachmentMeta}>Preview attachment</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <AdvanceInterestFormulaModal
        visible={showAdvanceInterestFormula}
        onClose={() => setShowAdvanceInterestFormula(false)}
        amounts={{
          basicAmount: invoiceData.subTotal,
          discount: invoiceData.discount.amount,
          gstAmount: invoiceData.tax.amount,
          tdsAmount: invoiceData.tdsAmount,
          advanceInterest:
            advanceInterestBreakdown?.advanceInterest ??
            invoiceData.advanceInterest,
          roiPercent,
          tenorDays: invoiceData.tenor,
        }}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'column',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    marginTop: scaleHeight(4),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleWidth(28),
    height: scaleWidth(28),
    marginLeft: scaleWidth(10),
  },
  invoiceTitleContainer: {flex: 1},
  invoiceTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  titleUnderline: {
    height: 1,
    backgroundColor: '#E6E6E6',
    width: '100%',
  },
  content: {padding: scaleWidth(16), paddingBottom: scaleHeight(28)},
  closeFooterButton: {
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(14),
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFooterButtonText: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: scaleWidth(10),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    marginBottom: scaleHeight(14),
  },
  emptyHint: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    paddingVertical: scaleHeight(8),
  },
  keyValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
    paddingVertical: scaleHeight(9),
    columnGap: scaleWidth(10),
  },
  keyValueRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: scaleHeight(9),
    columnGap: scaleWidth(10),
  },
  keyLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    flexShrink: 1,
  },
  keyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scaleWidth(6),
    marginRight: scaleWidth(8),
  },
  keyValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
  },
  itemCard: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: scaleWidth(8),
    marginBottom: scaleHeight(12),
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  itemHeader: {
    backgroundColor: '#4A4A4A',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
  },
  itemHeaderText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  itemDetails: {padding: scaleWidth(12)},
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
    columnGap: scaleWidth(10),
  },
  itemDetailRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleHeight(8),
    columnGap: scaleWidth(10),
  },
  itemDetailLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flex: 0.9,
  },
  itemDetailValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.darkblack,
    flex: 1.1,
    textAlign: 'right',
  },
  itemTotalValue: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  summaryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D0D5DD',
    marginVertical: scaleHeight(10),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#4A4A4A',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(8),
    marginTop: scaleHeight(12),
  },
  totalLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  totalValue: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  attachmentSectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
  },
  attachmentPreviewStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(12),
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    marginBottom: scaleHeight(10),
    minHeight: scaleHeight(84),
  },
  previewAttachmentImage: {
    width: scaleWidth(62),
    height: scaleWidth(62),
    borderRadius: scaleWidth(8),
    marginRight: scaleWidth(12),
    backgroundColor: Colors.white,
  },
  attachmentIcon: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  attachmentIconText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  attachmentIconPdf: {backgroundColor: '#E8F4FD'},
  attachmentInfo: {flex: 1},
  attachmentLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  attachmentMeta: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
  },
});
