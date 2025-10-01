import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import Colors from '@constants/Colors';
import {IKycDetailsResponseDatum} from '@store/kyc';
import {decryptUtility} from '@utils/crypto';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';
import {DownloadWhite} from '@assets/Icons';

// KycDocumentCard Component
interface KycDocumentCardProps {
  data: IKycDetailsResponseDatum;
  index: number;
  onPress: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export type {KycDocumentCardProps};

const getStatusStyle = (status: string | null) => {
  if (status === 'Eligibility Check') {
    return {
      backgroundColor: '#FF9800', // Orange
      color: '#FFFFFF'
    };
  } else if (status === 'Completed') {
    return {
      backgroundColor: '#4CAF50', // Green
      color: '#FFFFFF'
    };
  } else if (status === 'In Progress') {
    return {
      backgroundColor: '#2196F3', // Blue
      color: '#FFFFFF'
    };
  }
  return {
    backgroundColor: '#9E9E9E', // Default gray
    color: '#FFFFFF'
  };
};

// Format currency
const formatCurrency = (amount: number | null) => {
  if (!amount) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date for display
const formatDisplayDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
};

// Format month year
const formatMonthYear = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
};

export const KycDocumentCard: React.FC<KycDocumentCardProps> = ({
  data,
  index,
  onPress,
  onDownload,
  isDownloading = false,
}) => {
  const statusStyle = getStatusStyle(data.status || 'Eligibility Check');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.serialNumber}>{(index + 1).toString().padStart(2, '0')}</Text>
          <View style={styles.firmInfoContainer}>
            <Text style={styles.firmName}>{decryptUtility(data.firm_name || 'N/A')}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusStyle.backgroundColor}]}>
            <Text style={[styles.statusText, {color: statusStyle.color}]}>
              {data.status || 'Eligibility Check'}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sector:</Text>
            <Text style={styles.value}>{data.sector || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>City:</Text>
            <Text style={styles.value}>{decryptUtility(data.city || 'N/A')}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Initiator:</Text>
            <Text style={styles.value}>{data.file_by || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Source(D/H/C/O):</Text>
            <Text style={styles.value}>{data.source_of_lead || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Annual Turnover:</Text>
            <Text style={styles.valueCurrency}>{formatCurrency(data.annual_turnover)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Intent:</Text>
            <Text style={styles.value}>{data.intent || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Created At:</Text>
            <Text style={styles.value}>{formatMonthYear(data.created_at)}</Text>
          </View>
        </View>
        
        {/* Action Row with Download Button */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]} 
            onPress={onDownload}
            activeOpacity={0.7}
            disabled={isDownloading}
          >
            <DownloadWhite height={14} width={14} />
            <Text style={styles.downloadText}>
              {isDownloading ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginVertical: scaleHeight(6),
    marginHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(8),
    borderColor: '#E8E8E8',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(14),
    paddingBottom: scaleHeight(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: scaleHeight(10),
  },
  serialNumber: {
    fontSize: scaleFont(14),
    fontWeight: FontWeight.Bold,
    color: Colors.darkblack,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(4),
    minWidth: scaleWidth(32),
    textAlign: 'center',
    marginRight: scaleWidth(12),
  },
  firmInfoContainer: {
    flex: 1,
    marginRight: scaleWidth(12),
  },
  firmName: {
    fontSize: scaleFont(15),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(2),
  },
  sector: {
    fontSize: scaleFont(12),
    fontWeight: FontWeight.Regular,
    color: Colors.graybase,
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: scaleFont(11),
    fontWeight: FontWeight.SemiBold,
    textAlign: 'center',
  },
  mainContent: {
    backgroundColor: '#FEFEFE',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(6),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
    paddingVertical: scaleHeight(2),
  },
  label: {
    fontSize: scaleFont(13),
    fontWeight: FontWeight.Medium,
    color: Colors.gray600,
    flex: 1,
  },
  value: {
    fontSize: scaleFont(13),
    fontWeight: FontWeight.Regular,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
  },
  valueCurrency: {
    fontSize: scaleFont(13),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: scaleHeight(12),
    paddingTop: scaleHeight(8),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(6),
    gap: scaleWidth(6),
    shadowColor: Colors.primaryColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  downloadText: {
    fontSize: scaleFont(12),
    fontWeight: FontWeight.SemiBold,
    color: '#FFFFFF',
  },
  downloadButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
});