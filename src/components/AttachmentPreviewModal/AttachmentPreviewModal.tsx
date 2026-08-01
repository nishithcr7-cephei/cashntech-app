import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  fileNameFromAttachmentUrl,
  isImageAttachmentUrl,
  resolveInvoiceAttachmentUrl,
} from '@utils/invoiceAttachments';

type Props = {
  visible: boolean;
  urlOrPath?: string | null;
  onClose: () => void;
};

export const AttachmentPreviewModal: React.FC<Props> = ({
  visible,
  urlOrPath,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const remoteUrl = useMemo(
    () => (urlOrPath ? resolveInvoiceAttachmentUrl(urlOrPath) : ''),
    [urlOrPath],
  );
  const fileName = fileNameFromAttachmentUrl(remoteUrl || urlOrPath || '');
  const isImage = isImageAttachmentUrl(remoteUrl || urlOrPath || '');

  const handleClose = () => {
    setLoading(true);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View
        style={[
          styles.overlay,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {fileName || 'Attachment'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewBody}>
            {!remoteUrl ? (
              <Text style={styles.errorText}>Invalid attachment URL</Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : isImage ? (
              <>
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primaryColor} />
                  </View>
                )}
                <Image
                  source={{uri: remoteUrl}}
                  style={styles.image}
                  resizeMode="contain"
                  onLoadStart={() => {
                    setLoading(true);
                    setError(null);
                  }}
                  onLoadEnd={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Failed to load image');
                  }}
                />
              </>
            ) : (
              <>
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primaryColor} />
                  </View>
                )}
                <WebView
                  source={{uri: remoteUrl}}
                  style={styles.webview}
                  onLoadStart={() => {
                    setLoading(true);
                    setError(null);
                  }}
                  onLoadEnd={() => setLoading(false)}
                  onHttpError={event => {
                    setLoading(false);
                    const code = event?.nativeEvent?.statusCode;
                    setError(
                      code === 403
                        ? 'Access Denied — unable to open this attachment.'
                        : `Failed to load attachment${code ? ` (${code})` : ''}`,
                    );
                  }}
                  onError={() => {
                    setLoading(false);
                    setError('Failed to load attachment');
                  }}
                  startInLoadingState
                  scalesPageToFit
                  allowFileAccess
                  originWhitelist={['*']}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(12),
  },
  container: {
    width: '100%',
    maxHeight: '92%',
    height: '88%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  title: {
    flex: 1,
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    paddingRight: scaleWidth(8),
  },
  closeButton: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(26),
    color: Colors.darkblack,
    fontWeight: '300',
  },
  previewBody: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  errorText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
    textAlign: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  footer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
    backgroundColor: Colors.white,
  },
  cancelButton: {
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
});
