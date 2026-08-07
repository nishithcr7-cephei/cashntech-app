import React, {useMemo} from 'react';
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
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {decryptValue} from '@utils/decrypt';
import type {AdvanceInterestBreakdown} from '@utils/invoiceTotals';
import type {InvoiceFields} from '../../types/Invoice';

const fmtAmount = (n: number) =>
  n.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

type AttachmentItem = {id: number; attachment_url: string; fullUrl: string};

type InvoiceDetailData = {
  dealerName: string;
  dealerCode: string;
  odAccountNumber: string;
  anchorName: string;
  remark: string;
  poRefNo: string;
  invoiceDate: string;
  invoiceDueDate: string;
  items: Array<{id: string; itemName: string; quantity: number; unit: number | string; price: number; total: number}>;
  discount: {percent: number; amount: number};
  tax: {percent: number; amount: number};
  subTotal: number;
  tdsAmount: number;
  total: number;
  attachments: AttachmentItem[];
};

const mapPreviewFieldsToInvoiceData = (
  fields: InvoiceFields,
  attachment?: DocumentPickerResponse,
  anchorName?: string,
): InvoiceDetailData => {
  const normalizedItems = (fields.items || []).map((it: any, index) => {
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
  });

  const subTotalBeforeDiscountTax = normalizedItems.reduce(
    (sum, it: any) => sum + (Number(it.lineTotal) || 0),
    0,
  );
  const itemDiscountTotal = normalizedItems.reduce(
    (sum, it: any) => sum + (Number(it.discountAmount) || 0),
    0,
  );
  const itemTaxTotal = normalizedItems.reduce(
    (sum, it: any) => sum + (Number(it.taxAmount) || 0),
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

  const sumOfItemTotals = normalizedItems.reduce(
    (sum, it) => sum + (Number(it.total) || 0),
    0,
  );
  const subTotal = subTotalBeforeDiscountTax;
  const tdsAmount = Number(fields.tdsAmount) || 0;
  // Advance interest is a financing charge, not part of the invoice value.
  const total =
    Number(fields.grandTotal) || Math.max(0, sumOfItemTotals - tdsAmount);

  const discountPercent =
    subTotalBeforeDiscountTax > 0
      ? (discountAmount / subTotalBeforeDiscountTax) * 100
      : 0;
  const taxPercent =
    subTotalBeforeDiscountTax > 0
      ? (taxAmount / subTotalBeforeDiscountTax) * 100
      : 0;

  return {
    dealerName: decryptValue(fields.dealer ?? '') || fields.dealer || '',
    dealerCode: fields.dealerCode || '',
    odAccountNumber:
      decryptValue(fields.odAccountNumber ?? '') || fields.odAccountNumber || '',
    anchorName: anchorName || '',
    remark: fields.remark || '',
    poRefNo: fields.associatedPO || '',
    invoiceDate: fields.invoiceDate || '',
    invoiceDueDate: fields.invoiceDueDate || '',
    items: normalizedItems,
    discount: {percent: discountPercent, amount: discountAmount},
    tax: {percent: taxPercent, amount: taxAmount},
    subTotal,
    tdsAmount,
    total,
    attachments: attachment?.uri
      ? [
          {
            id: 0,
            attachment_url: attachment.name || 'Uploaded invoice',
            fullUrl: attachment.uri,
          },
        ]
      : [],
  };
};

export const InvoiceUploadPreview: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const dealerInfo = useSelector(selectDealerInfo);

  const previewFields = route?.params?.previewFields as InvoiceFields | undefined;
  const previewAttachment = route?.params?.previewAttachment as
    | DocumentPickerResponse
    | undefined;
  const previewAnchorName = route?.params?.previewAnchorName as string | undefined;
  const productType =
    (route?.params?.productType as 'dealer_finance' | 'vendor_finance' | undefined) ||
    'dealer_finance';
  const isVendorFinance = productType === 'vendor_finance';
  const counterpartyLabel = isVendorFinance ? 'Vendor Name' : 'Dealer Name';
  const counterpartyCodeLabel = isVendorFinance ? 'Vendor Code' : 'Dealer Code';
  const advanceInterestBreakdown = route?.params?.advanceInterestBreakdown as
    | AdvanceInterestBreakdown
    | null
    | undefined;

  const invoiceData = useMemo(
    () =>
      mapPreviewFieldsToInvoiceData(
        previewFields || ({} as InvoiceFields),
        previewAttachment,
        previewAnchorName ||
          (dealerInfo?.party?.entity_name
            ? decryptValue(dealerInfo.party.entity_name) || dealerInfo.party.entity_name
            : ''),
      ),
    [previewFields, previewAttachment, previewAnchorName],
  );

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
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>{counterpartyLabel}</Text>
            <Text style={styles.keyValue}>{invoiceData.dealerName || '-'}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>{counterpartyCodeLabel}</Text>
            <Text style={styles.keyValue}>{invoiceData.dealerCode || '-'}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>OD Account Number</Text>
            <Text style={styles.keyValue}>{invoiceData.odAccountNumber || '-'}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>Anchor Name</Text>
            <Text style={styles.keyValue}>{invoiceData.anchorName || '-'}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>PO Ref. No.</Text>
            <Text style={styles.keyValue}>{invoiceData.poRefNo || '-'}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>Invoice Date</Text>
            <Text style={styles.keyValue}>{invoiceData.invoiceDate || '-'}</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>Invoice Due Date</Text>
            <Text style={styles.keyValue}>{invoiceData.invoiceDueDate || '-'}</Text>
          </View>
          <View style={styles.keyValueRowLast}>
            <Text style={styles.keyLabel}>Remark</Text>
            <Text style={styles.keyValue}>{invoiceData.remark || '-'}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          {invoiceData.items.map((item, index) => (
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
                  <Text style={styles.itemDetailValue}>{fmtAmount(item.price)}</Text>
                </View>
                <View style={styles.itemDetailRowLast}>
                  <Text style={styles.itemDetailLabel}>Total:</Text>
                  <Text style={[styles.itemDetailValue, styles.itemTotalValue]}>
                    {fmtAmount(item.total)}/-
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>Sub Total</Text>
            <Text style={styles.keyValue}>{fmtAmount(invoiceData.subTotal)}/-</Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>Discount Total</Text>
            <Text style={styles.keyValue}>
              {fmtAmount(invoiceData.discount.amount)}/-
            </Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>Tax Total</Text>
            <Text style={styles.keyValue}>
              {fmtAmount(invoiceData.tax.amount)}/-
            </Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyLabel}>TDS</Text>
            <Text style={styles.keyValue}>
              {fmtAmount(invoiceData.tdsAmount)}/-
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total (Net)</Text>
            <Text style={styles.totalValue}>
              {fmtAmount(invoiceData.total)}/-
            </Text>
          </View>
        </View>

        {advanceInterestBreakdown?.applicable && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Financing</Text>
            <View style={styles.keyValueRow}>
              <Text style={styles.keyLabel}>Eligible Loan Amount</Text>
              <Text style={styles.keyValue}>
                {fmtAmount(advanceInterestBreakdown.eligibleLoanAmount)}/-
              </Text>
            </View>
            <View style={styles.keyValueRow}>
              <Text style={styles.keyLabel}>Advance Interest</Text>
              <Text style={styles.keyValue}>
                {fmtAmount(advanceInterestBreakdown.advanceInterest)}/-
              </Text>
            </View>
            <View style={styles.keyValueRow}>
              <Text style={styles.keyLabel}>Net Disbursal</Text>
              <Text style={styles.keyValue}>
                {fmtAmount(advanceInterestBreakdown.netDisbursal)}/-
              </Text>
            </View>
            <Text style={styles.financingNote}>
              Indicative. Final amounts are confirmed at disbursement.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.closeFooterButton}
          onPress={closePreview}
          activeOpacity={0.8}>
          <Text style={styles.closeFooterButtonText}>Close</Text>
        </TouchableOpacity>

        {invoiceData.attachments.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.attachmentSectionTitle}>Attachments</Text>
            {invoiceData.attachments.map((att) => {
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
                    <View style={[styles.attachmentIcon, isPdf && styles.attachmentIconPdf]}>
                      <Text style={styles.attachmentIconText}>{isPdf ? 'PDF' : 'FILE'}</Text>
                    </View>
                  )}
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentLabel} numberOfLines={1} ellipsizeMode="middle">
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
    flex: 1,
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
  financingNote: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginTop: scaleHeight(8),
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
