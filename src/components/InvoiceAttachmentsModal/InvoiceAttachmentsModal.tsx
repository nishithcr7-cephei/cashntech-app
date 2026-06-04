import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
} from 'react-native';
import {
  DocumentPickerResponse,
  pick,
  types,
} from '@react-native-documents/picker';
import {File, RightCheckmarkWhite} from '@assets/Icons';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {invoiceApi} from '@services/api/invoice.api';
import {tryCatch} from '@utils/TryCatch';
import {
  fileNameFromAttachmentUrl,
  mapInvoiceAttachmentsWithUrls,
  type InvoiceAttachmentItem,
} from '@utils/invoiceAttachments';
import Toast from 'react-native-toast-message';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

const ALLOWED = ['jpg', 'jpeg', 'png', 'pdf'];

type Props = {
  visible: boolean;
  invoiceId: string | null;
  /** Pre-loaded attachments from invoice list row (fallback while details load). */
  fallbackAttachments?: InvoiceAttachmentItem[];
  onClose: () => void;
  /** After upload or delete succeeds */
  onListChanged?: () => void;
};

export const InvoiceAttachmentsModal: React.FC<Props> = ({
  visible,
  invoiceId,
  fallbackAttachments,
  onClose,
  onListChanged,
}) => {
  const [attachments, setAttachments] = useState<InvoiceAttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<DocumentPickerResponse | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAttachments = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    if (fallbackAttachments?.length) {
      setAttachments(fallbackAttachments);
    }
    const {data, error} = await tryCatch(invoiceApi.getInvoiceDetails(invoiceId));
    setLoading(false);
    if (error || data == null) {
      if (!fallbackAttachments?.length) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load attachments',
          text2: (error as Error)?.message ?? 'Please try again',
        });
        setAttachments([]);
      }
      return;
    }
    const fromDetails = mapInvoiceAttachmentsWithUrls(data);
    setAttachments(
      fromDetails.length > 0
        ? fromDetails
        : fallbackAttachments?.length
          ? fallbackAttachments
          : [],
    );
  }, [invoiceId, fallbackAttachments]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (!invoiceId) {
      setAttachments(fallbackAttachments ?? []);
      return;
    }
    setPendingFile(undefined);
    loadAttachments();
  }, [visible, invoiceId, loadAttachments, fallbackAttachments]);

  const handleBrowse = async () => {
    const {data, error} = await tryCatch(
      pick({
        mode: 'import',
        allowMultiSelection: false,
        type: [types.images, types.pdf],
      }),
    );
    if (error || !data?.length) return;
    const file = data[0];
    const ext = file.name?.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED.includes(ext)) {
      Toast.show({
        type: 'error',
        text1: 'Unsupported file',
        text2: `Use ${ALLOWED.join(', ').toUpperCase()}`,
      });
      return;
    }
    setPendingFile(file);
  };

  const handleDelete = async (row: InvoiceAttachmentItem) => {
    if (row.id == null || Number.isNaN(row.id)) {
      Toast.show({type: 'error', text1: 'Invalid attachment'});
      return;
    }
    setDeletingId(row.id);
    const {error} = await tryCatch(
      invoiceApi.deleteInvoiceAttachment(row.id),
    );
    setDeletingId(null);
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: (error as Error)?.message ?? '',
      });
      return;
    }
    Toast.show({type: 'success', text1: 'Attachment deleted'});
    await loadAttachments();
    onListChanged?.();
  };

  const handleView = async (row: InvoiceAttachmentItem) => {
    if (!row.fullUrl) {
      Toast.show({type: 'error', text1: 'Invalid attachment URL'});
      return;
    }
    try {
      await Linking.openURL(row.fullUrl);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to open attachment');
    }
  };

  const handleSubmit = async () => {
    if (!invoiceId || !pendingFile) return;
    setSubmitting(true);
    const {error} = await tryCatch(
      invoiceApi.uploadInvoiceAttachment(invoiceId, pendingFile),
    );
    setSubmitting(false);
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: (error as Error)?.message ?? '',
      });
      return;
    }
    Toast.show({type: 'success', text1: 'Attachment uploaded'});
    setPendingFile(undefined);
    await loadAttachments();
    onListChanged?.();
  };

  const totalCount = attachments.length + (pendingFile ? 1 : 0);
  const canSubmit = !!pendingFile && !submitting && !!invoiceId;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.popup}>
              <View style={styles.modalHeader}>
                <Text style={styles.title}>Upload Attachment</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.uploadBox}
                activeOpacity={0.7}
                onPress={handleBrowse}
                disabled={submitting}>
                <File width={scaleWidth(40)} height={scaleHeight(40)} />
                <Text style={styles.uploadText}>Choose your files</Text>
              </TouchableOpacity>

              {totalCount > 0 && (
                <View style={styles.badgeWrap}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {totalCount} file{totalCount === 1 ? '' : 's'} total
                    </Text>
                  </View>
                </View>
              )}

              {pendingFile && (
                <View style={styles.pendingRow}>
                  <FontAwesome6
                    name="file"
                    iconStyle="solid"
                    color="#2563EB"
                    size={18}
                  />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {pendingFile.name} (pending upload)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPendingFile(undefined)}
                    hitSlop={8}>
                    <Text style={styles.removePending}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}

              {loading ? (
                <View style={styles.listLoading}>
                  <ActivityIndicator color={Colors.primaryColor} />
                </View>
              ) : (
                <FlatList
                  data={attachments}
                  keyExtractor={item =>
                    Number.isFinite(item.id) && item.id > 0
                      ? String(item.id)
                      : item.attachment_url
                  }
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    !pendingFile ? (
                      <Text style={styles.emptyText}>No attachments yet</Text>
                    ) : null
                  }
                  renderItem={({item}) => (
                    <View style={styles.fileRow}>
                      <FontAwesome6
                        name="file-lines"
                        iconStyle="solid"
                        color="#2563EB"
                        size={18}
                      />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {fileNameFromAttachmentUrl(item.attachment_url)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleView(item)}
                        hitSlop={8}
                        style={styles.viewButton}>
                        <FontAwesome6
                          name="eye"
                          iconStyle="regular"
                          color={Colors.primaryColor}
                          size={16}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        hitSlop={8}>
                        {deletingId === item.id ? (
                          <ActivityIndicator size="small" color={Colors.red} />
                        ) : (
                          <FontAwesome6
                            name="trash"
                            iconStyle="solid"
                            color={Colors.red}
                            size={16}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={submitting}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !canSubmit && styles.submitButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                  disabled={!canSubmit}
                  onPress={handleSubmit}>
                  {canSubmit ? (
                    <RightCheckmarkWhite
                      width={scaleWidth(16)}
                      height={scaleHeight(16)}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.submitButtonText,
                      !canSubmit && styles.submitButtonTextDisabled,
                    ]}>
                    Submit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '88%',
    maxHeight: '82%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  title: {
    fontSize: scaleFont(17),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(26),
    color: '#888',
    fontWeight: '300',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#B0B0B0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(36),
    paddingHorizontal: scaleWidth(16),
    alignItems: 'center',
    justifyContent: 'center',
    margin: scaleWidth(16),
    marginBottom: scaleHeight(8),
    backgroundColor: '#FAFAFA',
    minHeight: scaleHeight(140),
  },
  uploadText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#808080',
    marginTop: scaleHeight(10),
  },
  badgeWrap: {
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(8),
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#22C55E',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
  },
  countBadgeText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(8),
    padding: scaleWidth(12),
    backgroundColor: '#F3F4F6',
    borderRadius: scaleWidth(8),
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(8),
    backgroundColor: '#F3F4F6',
    borderRadius: scaleWidth(8),
  },
  fileName: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  viewButton: {
    paddingHorizontal: scaleWidth(4),
  },
  removePending: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  list: {
    maxHeight: scaleHeight(220),
  },
  listContent: {
    paddingBottom: scaleHeight(8),
  },
  listLoading: {
    paddingVertical: scaleHeight(24),
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(13),
    paddingVertical: scaleHeight(16),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(8),
    paddingBottom: scaleHeight(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.green,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
