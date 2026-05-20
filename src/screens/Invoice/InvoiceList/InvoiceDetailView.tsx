import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
        Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {AppBar, Container, UploadModal} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Download, LeftChevron} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {invoiceApi} from '@services/api/invoice.api';
import {formatDateDash} from './components/InvoiceDetails/types';
import {decryptValue} from '@utils/decrypt';
import {FILE_DOWNLOAD_URL} from '@config/config';
import {DocumentPickerResponse} from '@react-native-documents/picker';

const fmtAmount = (n: number) =>
  n.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const fmtPercent = (n: number) => Number(n).toFixed(2);

type AttachmentItem = {id: number; attachment_url: string; fullUrl: string};

type InvoiceDetailData = {
  dealerName: string;
  dealerCode: string;
  odAccountNumber: string;
  anchorName: string;
  remark: string;
  poRefNo: string;
  tenorDays: string;
  invoiceDate: string;
  invoiceDueDate: string;
  earlyPaymentDiscount: number;
  items: Array<{id: string; itemName: string; quantity: number; unit: number | string; price: number; total: number}>;
  discount: {percent: number; amount: number};
  tax: {percent: number; amount: number};
  total: number;
  attachments: AttachmentItem[];
  invoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;
};

const defaultInvoiceData: InvoiceDetailData = {
  dealerName: '',
  dealerCode: '',
  odAccountNumber: '',
  anchorName: '',
  remark: '',
  poRefNo: '',
  tenorDays: '',
  invoiceDate: '',
  invoiceDueDate: '',
  earlyPaymentDiscount: 0,
  items: [],
  discount: {percent: 0, amount: 0},
  tax: {percent: 0, amount: 0},
  total: 0,
  attachments: [],
  invoiceStatus: '',
  approvalStatus: '',
  adminStatus: '',
};

const STATUS_COLORS = {
  ATTACHMENT_PENDING: { backgroundColor: '#FFF4E5', color: '#FF8C00' },
  CREATED: { backgroundColor: '#E3F2FD', color: '#1976D2' },
  DISBURSED: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  REJECTED: { backgroundColor: '#FFEBEE', color: '#D32F2F' },
  DEFAULT: { backgroundColor: '#F7F8FB', color: Colors.darkblack },
};

function getInvoiceStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('attachment pending')) return STATUS_COLORS.ATTACHMENT_PENDING;
  if (s.includes('created')) return STATUS_COLORS.CREATED;
  if (s.includes('disbursed')) return STATUS_COLORS.DISBURSED;
  if (s.includes('reject')) return STATUS_COLORS.REJECTED;
  return STATUS_COLORS.DEFAULT;
}

function getApprovalStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('pending')) return STATUS_COLORS.ATTACHMENT_PENDING;
  if (s.includes('reject')) return STATUS_COLORS.REJECTED;
  if (s.includes('completed') || s.includes('approval complete')) return STATUS_COLORS.DISBURSED;
  return STATUS_COLORS.DEFAULT;
}

function getAdminStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'verify' || s === 'verified' || s === 'submitted') return STATUS_COLORS.DISBURSED;
  if (s === 'hold') return { backgroundColor: '#E0E0E0', color: '#6B5B4F' };
  if (s === 'reject' || s === 'rejected') return STATUS_COLORS.REJECTED;
  return STATUS_COLORS.DEFAULT;
}

function formatStatus(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const InvoiceDetailView: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const programSelection = useSelector(selectProgramSelection);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCheckerRole = isAnchorChecker || isDealerChecker;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceDetailData>(defaultInvoiceData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const invoiceId = route?.params?.invoiceId || '';
  const invoiceNo = route?.params?.invoiceNo || '';

  useEffect(() => {
    if (!invoiceId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    invoiceApi
      .getInvoiceDetails(invoiceId)
      .then((data: any) => {
        if (cancelled) return;
        const apm = data?.anchorParticipantMapping;
        const party = data?.party;
        const dealerName =
          decryptValue(apm?.party?.entity_name ?? '') || '';
        const dealerCode = apm?.company_code_given_by_party ?? '';
        const odAccountNumber =
          decryptValue(apm?.od_account_no ?? '') || '';
        const anchorName = decryptValue(party?.entity_name ?? '') || '';
        const remark = data?.remark ?? '';
        const poRef =
          data?.po_ref_no != null && String(data.po_ref_no).trim() !== ''
            ? String(data.po_ref_no)
            : '';
        const poRefNo =
          poRef ||
          (data?.loan_ref_no != null ? String(data.loan_ref_no) : '') ||
          (data?.invoice_ref_no != null ? String(data.invoice_ref_no) : '');
        const invoiceDate = data?.invoice_date ? formatDateDash(data.invoice_date) : '';
        const invoiceDueDate = data?.invoice_due_date ? formatDateDash(data.invoice_due_date) : '';
        const tenorDays =
          data?.tenor != null && data?.tenor !== ''
            ? String(Math.round(Number(data.tenor)))
            : '';
        const earlyPaymentDiscount = Number(data?.early_payment_discount) || 0;
        const subTotal = Number(data?.sub_total) || 0;
        const taxTotal = Number(data?.tax_total) || 0;
        const discountTotal = Number(data?.discount_total) || 0;
        const finalTotal = Number(data?.final_total) || 0;
        const items = (data?.invoiceItems || []).map((it: any, idx: number) => ({
          id: it.id || `item-${idx}`,
          itemName: it.name ?? '',
          quantity: Number(it.quantity) || 0,
          unit: it.unit ?? '-',
          price: Number(it.price_per_quantity) || 0,
          total: Number(it.total) || 0,
        }));
        const discountPercent = subTotal > 0 ? (discountTotal / subTotal) * 100 : 0;
        const taxPercent = subTotal > 0 ? (taxTotal / subTotal) * 100 : 0;
        const baseUrl =
          (FILE_DOWNLOAD_URL || '').trim() ||
          'https://d2wayd1he5a7q1.cloudfront.net';
        const rawAttachments = data?.attachment ?? (data?.attachment_url ? [{attachment_url: data.attachment_url}] : []);
        const attachments: AttachmentItem[] = (Array.isArray(rawAttachments) ? rawAttachments : []).map(
          (a: any, idx: number) => {
            const url = (a?.attachment_url || '').trim();
            const fullUrl = url ? (url.startsWith('http') ? url : `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`) : '';
            return {id: a?.id ?? idx, attachment_url: url, fullUrl};
          },
        ).filter(a => a.fullUrl);
        setInvoiceData({
          dealerName,
          dealerCode,
          odAccountNumber,
          anchorName,
          remark,
          poRefNo,
          tenorDays,
          invoiceDate,
          invoiceDueDate,
          earlyPaymentDiscount,
          items,
          discount: {percent: discountPercent, amount: discountTotal},
          tax: {percent: taxPercent, amount: taxTotal},
          total: finalTotal,
          attachments,
          invoiceStatus: formatStatus(data?.invoice_status || ''),
          approvalStatus: formatStatus(data?.approval_status || ''),
          adminStatus: formatStatus(data?.admin_status || ''),
        });
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load invoice details');
          setInvoiceData(defaultInvoiceData);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  const handleAttachment = () => {
    setShowUploadModal(true);
  };

  const handleAttachmentUpload = (_file?: DocumentPickerResponse) => {
    setShowUploadModal(false);
  };

  const handleExport = () => {};

  const openAttachment = async (fullUrl: string, label: string) => {
    try {
      await Linking.openURL(fullUrl);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to open attachment');
    }
  };

  if (loading) {
    return (
      <Container>
        <AppBar
          title="Invoice Detail"
          navigation={navigation as any}
          hideHamburger={isCheckerRole}
          renderLeftIcon={
            isCheckerRole ? (
              <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />
            ) : undefined
          }
          onPressLeftIcon={
            isCheckerRole
              ? () =>
                  (navigation as any).navigate('InvoiceDetails', {
                    programId: programSelection?.programId,
                  })
              : undefined
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.loadingText}>Loading invoice details...</Text>
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <AppBar
          title="Invoice Detail"
          navigation={navigation as any}
          hideHamburger={isCheckerRole}
          renderLeftIcon={
            isCheckerRole ? (
              <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />
            ) : undefined
          }
          onPressLeftIcon={
            isCheckerRole ? () => (navigation as any).goBack() : undefined
          }
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <AppBar
        title="Invoice Detail"
        navigation={navigation as any}
        hideHamburger={isCheckerRole}
        renderLeftIcon={
          isCheckerRole ? (
            <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />
          ) : undefined
        }
        onPressLeftIcon={
          isCheckerRole
            ? () =>
                (navigation as any).navigate('InvoiceDetails', {
                  programId: programSelection?.programId,
                })
            : undefined
        }
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          {!isCheckerRole && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                (navigation as any).navigate('InvoiceDetails', {
                  programId: programSelection?.programId,
                })
              }>
              <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
            </TouchableOpacity>
          )}
          <View style={styles.invoiceTitleContainer}>
            <Text style={styles.invoiceTitle}>
              Invoice / Unique Ref. No - {invoiceNo || invoiceId || 'N/A'}
            </Text>
            <View style={styles.statusBadgesRow}>
               {invoiceData.invoiceStatus && (
                 <View style={[styles.statusBadge, { backgroundColor: getInvoiceStatusStyles(invoiceData.invoiceStatus).backgroundColor }]}>
                   <Text style={[styles.statusBadgeText, { color: getInvoiceStatusStyles(invoiceData.invoiceStatus).color }]}>{invoiceData.invoiceStatus}</Text>
                 </View>
               )}
               {invoiceData.approvalStatus && (
                 <View style={[styles.statusBadge, { backgroundColor: getApprovalStatusStyles(invoiceData.approvalStatus).backgroundColor }]}>
                   <Text style={[styles.statusBadgeText, { color: getApprovalStatusStyles(invoiceData.approvalStatus).color }]}>{invoiceData.approvalStatus}</Text>
                 </View>
               )}
               {invoiceData.adminStatus && (
                 <View style={[styles.statusBadge, { backgroundColor: getAdminStatusStyles(invoiceData.adminStatus).backgroundColor }]}>
                   <Text style={[styles.statusBadgeText, { color: getAdminStatusStyles(invoiceData.adminStatus).color }]}>{invoiceData.adminStatus}</Text>
                 </View>
               )}
            </View>
            <View style={styles.titleUnderline} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {}}
            disabled>
            <FontAwesome6
              name="paperclip"
              iconStyle="solid"
              color={Colors.darkblack}
              size={scaleWidth(18)}
            />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>
              Attachment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {}}
            disabled>
            <Download width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>
              Export
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Invoice Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailColumn}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dealer Name:</Text>
                <Text style={styles.detailValue}>{invoiceData.dealerName || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dealer Code:</Text>
                <Text style={styles.detailValue}>{invoiceData.dealerCode || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>OD Account Number:</Text>
                <Text style={styles.detailValue}>
                  {invoiceData.odAccountNumber || '-'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Anchor Name:</Text>
                <Text style={styles.detailValue}>{invoiceData.anchorName || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Remark:</Text>
                <Text style={styles.detailValue}>{invoiceData.remark || '-'}</Text>
              </View>
            </View>

            <View style={styles.detailColumn}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PO Ref. No.:</Text>
                <Text
                  style={[styles.detailValue, styles.detailValueSmall]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}>
                  {invoiceData.poRefNo || '-'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Invoice Date:</Text>
                <Text style={styles.detailValue}>{invoiceData.invoiceDate || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Invoice Due Date:</Text>
                <Text style={styles.detailValue}>
                  {invoiceData.invoiceDueDate || '-'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tenor (days):</Text>
                <Text style={styles.detailValue}>{invoiceData.tenorDays || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Early Payment Discount (%):</Text>
                <Text style={styles.detailValue}>
                  {fmtPercent(invoiceData.earlyPaymentDiscount)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
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
                  <Text style={styles.itemDetailValue}>
                    {fmtAmount(item.price)}
                  </Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Total:</Text>
                  <Text style={[styles.itemDetailValue, styles.itemTotalValue]}>
                    {fmtAmount(item.total)}/-
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Financial Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount:</Text>
            <Text style={styles.summaryValue}>
              {fmtPercent(invoiceData.discount.percent)}% ({fmtAmount(invoiceData.discount.amount)}/-)
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax Value:</Text>
            <Text style={styles.summaryValue}>
              {fmtPercent(invoiceData.tax.percent)}% ({fmtAmount(invoiceData.tax.amount)}/-)
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {fmtAmount(invoiceData.total)}/-
            </Text>
          </View>
        </View>

        {/* Attachments */}
        {invoiceData.attachments.length > 0 && (
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentSectionTitle}>Attachments</Text>
            {invoiceData.attachments.map((att, idx) => {
              const fileName = att.attachment_url?.split('/').pop() || `Attachment ${idx + 1}`;
              const isPdf = fileName.toLowerCase().endsWith('.pdf');
              return (
                <TouchableOpacity
                  key={att.id}
                  style={styles.attachmentPreview}
                  onPress={() => openAttachment(att.fullUrl, fileName)}
                  activeOpacity={0.7}>
                  <View style={[styles.attachmentIcon, isPdf && styles.attachmentIconPdf]}>
                    <Text style={styles.attachmentIconText}>{isPdf ? 'PDF' : 'FILE'}</Text>
                  </View>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentLabel} numberOfLines={1}
                      ellipsizeMode="middle">{fileName}</Text>
                    <Text style={styles.attachmentMeta}>
                      Tap to {Platform.OS === 'ios' ? 'open in browser' : 'view'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <UploadModal
          visible={showUploadModal}
          allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
            onClose={handleAttachmentUpload}
        />
    </Container>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(24),
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  errorText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.red,
    textAlign: 'center',
  },
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
  backButton: {
    marginRight: scaleWidth(12),
    marginTop: scaleHeight(2),
  },
  invoiceTitleContainer: {
    flex: 1,
  },
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
    marginTop: scaleHeight(8),
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(4),
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(4),
  },
  statusBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
  },
  actionButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  actionButtonTextDisabled: {
    color: Colors.graybase,
  },
  content: {
    padding: scaleWidth(16),
  },
  detailsSection: {
    marginBottom: scaleHeight(24),
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: scaleWidth(16),
  },
  detailColumn: {
    flex: 1,
  },
  detailItem: {
    marginBottom: scaleHeight(16),
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  detailValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.darkblack,
  },
  detailValueSmall: {
    fontSize: scaleFont(11),
  },
  descriptionSection: {
    marginBottom: scaleHeight(24),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
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
  itemDetails: {
    padding: scaleWidth(12),
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  itemDetailLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flex: 1,
  },
  itemDetailValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
  },
  itemTotalValue: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  summarySection: {
    marginBottom: scaleHeight(16),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  summaryLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  summaryValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  totalSection: {
    marginBottom: scaleHeight(24),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#4A4A4A',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(8),
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
  attachmentSection: {
    marginTop: scaleHeight(16),
  },
  attachmentSectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(12),
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    marginBottom: scaleHeight(10),
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
  attachmentIconPdf: {
    backgroundColor: '#E8F4FD',
  },
  attachmentInfo: {
    flex: 1,
  },
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
