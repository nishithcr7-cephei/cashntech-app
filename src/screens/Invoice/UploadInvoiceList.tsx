import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AppBar, Container, UploadModal, DashedButton, FilterModal, ProgramBreadcrumb} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, LeftChevron} from '@assets/Icons';
import {DocumentPickerResponse} from '@react-native-documents/picker';

// Sample data matching the screenshot
const uploadInvoiceData = [
  {
    id: '1',
    invoiceNumber: '123101010',
    progressStatus: 'Pending',
    remark: 'All relevant details verified before submission.',
  },
  {
    id: '2',
    invoiceNumber: '123101010',
    progressStatus: 'Pending',
    remark: 'All relevant details verified before submission.',
  },
  {
    id: '3',
    invoiceNumber: '123101010',
    progressStatus: 'Pending',
    remark: 'All relevant details verified before submission.',
  },
  {
    id: '4',
    invoiceNumber: '123101010',
    progressStatus: 'Pending',
    remark: 'All relevant details verified before submission.',
  },
  {
    id: '5',
    invoiceNumber: '123101010',
    progressStatus: 'Pending',
    remark: 'All relevant details verified before submission.',
  },
];

// Dummy filter data for Upload Invoice List
const uploadInvoiceFilterData = {
  'Progress Status': ['Pending', 'Approved', 'Rejected'],
  'Invoice Number': ['123101010', '123101011', '123101012'],
};

export const UploadInvoiceList: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<DocumentPickerResponse | undefined>();
  const [uploading, setUploading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return uploadInvoiceData;
    const term = searchText.toLowerCase();
    return uploadInvoiceData.filter(
      item =>
        item.invoiceNumber.toLowerCase().includes(term) ||
        item.remark.toLowerCase().includes(term),
    );
  }, [searchText]);

  return (
    <Container>
      <AppBar title="Invoice Dashboard" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            (navigation as any).navigate('InvoiceDetails');
          }}>
          <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
        </TouchableOpacity>
        <Text style={styles.pageTitleText}>Upload Invoice</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Invoice Badge Header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceBadgeContainer}>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>100</Text>
            </View>
          </View>
        </View>

        {/* Upload Button Section */}
        <View style={styles.uploadSection}>
          <DashedButton
            label="Upload Invoice Document"
            onPress={() => setIsUploadModalVisible(true)}
          />
          {uploadedFile && (
            <View style={styles.uploadedFilePreview}>
              <Text style={styles.fileNameText}>Selected: {uploadedFile.name}</Text>
              {uploadedFile.type?.startsWith('image/') && (
                <Image 
                  source={{uri: uploadedFile.uri}} 
                  style={styles.previewImage} 
                />
              )}
              {uploadedFile.name?.endsWith('.pdf') && (
                <Text style={styles.pdfPreviewText}>PDF Document Selected</Text>
              )}
            </View>
          )}
        </View>

        {/* Search and Filter Toolbar */}
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Search width={scaleWidth(18)} height={scaleHeight(18)} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.graybase}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}>
            <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Invoice List */}
        <View style={styles.verticalList}>
          {filteredData.map((row, index) => (
            <View
              key={row.id}
              style={styles.listCard}>
              {/* Header row with Invoice Number and Status Badge */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Invoice Number</Text>
                  <Text style={styles.cardValue}>{row.invoiceNumber}</Text>
                </View>
                <View style={[styles.statusChip, styles.statusWarningChip]}>
                  <Text style={[styles.statusChipText, styles.statusWarningText]}>
                    {row.progressStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Remark</Text>
                  <Text style={styles.remarkText}>{row.remark}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* UploadModal */}
      <UploadModal
        visible={isUploadModalVisible}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={(file) => {
          if (file) {
            setUploading(true);
            setTimeout(() => {
              setUploadedFile(file);
              setUploading(false);
              setIsUploadModalVisible(false);
              // File selected successfully - API call yaha baad me add karengay
            }, 1000);
          } else {
            setIsUploadModalVisible(false);
          }
        }}
      />

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          // TODO: Apply filters to data later
        }}
        filterData={uploadInvoiceFilterData}
        appliedFilters={appliedFilters}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: Colors.white,
  },
  pageTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  backButton: {
    marginRight: scaleWidth(12),
    padding: scaleWidth(4),
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  invoiceHeader: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  invoiceBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  invoiceLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  badge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    backgroundColor: Colors.white,
    gap: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  verticalList: {
    gap: scaleHeight(12),
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
  },
  cardRow: {
    marginBottom: scaleHeight(12),
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  cardValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  statusChip: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    backgroundColor: '#E6F7EF',
  },
  statusChipText: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(12),
  },
  statusWarningChip: {
    backgroundColor: '#FFF4E0',
  },
  statusWarningText: {
    color: Colors.Yellow,
  },
  remarkText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
    lineHeight: scaleHeight(20),
  },
  uploadSection: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(16),
  },
  uploadedFilePreview: {
    marginTop: scaleHeight(12),
    padding: scaleWidth(12),
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
  },
  fileNameText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
    fontFamily: Fonts.GilroyMedium,
  },
  previewImage: {
    width: '100%',
    height: scaleHeight(200),
    borderRadius: scaleWidth(8),
    resizeMode: 'contain',
  },
  pdfPreviewText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontStyle: 'italic',
    fontFamily: Fonts.GilroyMedium,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
});

