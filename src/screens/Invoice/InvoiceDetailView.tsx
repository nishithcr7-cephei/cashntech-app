import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {AppBar, Container, UploadModal} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Download, LeftChevron} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';

export const InvoiceDetailView: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCheckerRole = isAnchorChecker || isDealerChecker;
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Get data from route params
  const invoiceId = (route.params as any)?.invoiceId || '';
  const invoiceNo = (route.params as any)?.invoiceNo || '1234566';

  // Sample invoice data - in real app, fetch from API
  const invoiceData = {
    dealerName: '',
    dealerCode: '',
    creditAccountNumber: '',
    anchorName: '',
    remark: '',
    poRefNo: '',
    invoiceDate: '',
    invoiceDueDate: '',
    items: [
      {
        id: '1',
        itemName: 'Item Name 1',
        quantity: 50,
        unit: 20,
        price: 3000,
        total: 150000,
      },
      {
        id: '2',
        itemName: 'Item Name 2',
        quantity: 40,
        unit: 30,
        price: 5000,
        total: 200000,
      },
    ],
    discount: {
      percent: 2,
      amount: 7000,
    },
    tax: {
      percent: 10,
      amount: 35000,
    },
    total: 378000,
    attachment: {
      fileName: 'attachment.jpg',
      fileSize: '1.2 MB',
      fileCount: 1,
    },
  };

  const handleAttachment = () => {
    setShowUploadModal(true);
  };

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    if (file) {
      // TODO: Upload file to API
      console.log('Upload attachment for invoice:', invoiceId, file.name);
    }
    setShowUploadModal(false);
  };

  const handleExport = () => {
    // TODO: Export invoice functionality
    console.log('Export invoice:', invoiceId);
  };

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
            ? () => (navigation as any).navigate('InvoiceDetails')
            : undefined
        }
      />
      
      {/* Header with Invoice Number and Action Buttons */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {!isCheckerRole && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
            </TouchableOpacity>
          )}
          <View style={styles.invoiceTitleContainer}>
            <Text style={styles.invoiceTitle}>
              Invoice / Unique Ref. No - {invoiceNo}
            </Text>
            <View style={styles.titleUnderline} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAttachment}>
            <FontAwesome6
              name="paperclip"
              iconStyle="solid"
              color={Colors.darkblack}
              size={scaleWidth(18)}
            />
            <Text style={styles.actionButtonText}>Attachment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExport}>
            <Download width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.actionButtonText}>Export</Text>
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
                <Text style={styles.detailLabel}>Credit Account Number:</Text>
                <Text style={styles.detailValue}>
                  {invoiceData.creditAccountNumber || '-'}
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
                <Text style={styles.detailValue}>{invoiceData.poRefNo || '-'}</Text>
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
                    {item.price.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Total:</Text>
                  <Text style={[styles.itemDetailValue, styles.itemTotalValue]}>
                    {item.total.toLocaleString('en-IN')}/-
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
              {invoiceData.discount.percent}% ({invoiceData.discount.amount.toLocaleString('en-IN')}/-)
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax Value:</Text>
            <Text style={styles.summaryValue}>
              {invoiceData.tax.percent}% ({invoiceData.tax.amount.toLocaleString('en-IN')}/-)
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {invoiceData.total.toLocaleString('en-IN')}/-
            </Text>
          </View>
        </View>

        {/* Attachment Preview */}
        {invoiceData.attachment && (
          <View style={styles.attachmentSection}>
            <View style={styles.attachmentPreview}>
              <View style={styles.attachmentIcon}>
                <Text style={styles.attachmentIconText}>JPG</Text>
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentLabel}>Attachment</Text>
                <Text style={styles.attachmentMeta}>
                  {invoiceData.attachment.fileCount} file, {invoiceData.attachment.fileSize}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Upload Attachment Modal */}
      <UploadModal
        visible={showUploadModal}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={handleAttachmentUpload}
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
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(12),
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
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
