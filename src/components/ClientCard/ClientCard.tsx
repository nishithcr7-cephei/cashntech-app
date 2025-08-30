import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import React, {useState} from 'react';
import {Colors} from '@constants/index';
import {IClientInfoResponseDatum} from '@store/client';
import {Dots} from '@assets/Icons';
import {scaleHeight, scaleWidth} from '@utils/Scale';
import {decryptUtility, decryptLocation, decryptConditionally} from '@utils/crypto';
import {ApiEndPoints} from '@constants/index';
import {Api} from '@services/api';
import {getStorage} from '@services/localStorage';
import Toast from 'react-native-toast-message';

const Strings = {
  clientId: 'Client ID :',
  clientName: 'Client Name :',
  firmName: 'Firm Name :',
  location: 'City :',
  initiator: 'Initiator :',
  sourceDHCO: 'Program Type :',
  referenceDetails: 'Reference Details :',
  monthlyTurnover: 'Monthly Turnover :',
  sanctionRequested: 'Sanction Requested :',
  financier: 'Financier :',
  readMore: 'Read more',
  edit: 'Edit',
  delete: 'Delete',
};

const ChipColors = {
  Warm: '#FFC107',
  Hot: '#FF5656',
  Cold: Colors.tertiaryBlue,
};

type ClientCardProps = {
  data: IClientInfoResponseDatum;
  onPressReadMore: (id: number) => void;
  onPressCard: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
};

export const ClientCard: React.FC<ClientCardProps> = ({
  data,
  onPressReadMore,
  onPressCard,
  onEdit,
  onDelete,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleOptionPress = (option: 'edit' | 'delete') => {
    setMenuVisible(false);
    if (option === 'edit') {
      if (onEdit) onEdit(data.id);
    }
    if (option === 'delete') {
      Alert.alert(
        'Are you sure to delete?',
        "This can't be undone.",
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              let firstName = getStorage('user_first_name');
              let lastName = getStorage('user_last_name');
              let deletedBy = 'Test User';
              if (firstName && lastName) {
                deletedBy = `${firstName} ${lastName}`;
              } else if (firstName) {
                deletedBy = firstName;
              } else if (lastName) {
                deletedBy = lastName;
              }
              try {
                const response = await Api.post(
                  ApiEndPoints.apiDeleteClient(data.id),
                  {deleted_by: deletedBy},
                );
                Toast.show({
                  type: 'success',
                  text1: 'Client deleted successfully',
                  visibilityTime: 2000,
                });
                if (onDelete) onDelete(data.id);
              } catch (error) {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to delete client',
                  visibilityTime: 2000,
                });
              }
            },
          },
        ],
        {cancelable: true},
      );
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.threeDotsButton}
        onPress={toggleMenu}
        activeOpacity={0.7}>
        <Dots height={scaleHeight(32)} width={scaleWidth(36)} />
      </TouchableOpacity>
      {/* Dropdown menu */}
      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => handleOptionPress('edit')}>
            <Text style={styles.menuText}>{Strings.edit}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleOptionPress('delete')}
            style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>{Strings.delete}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={() => onPressCard(data.id)}
        activeOpacity={0.7}>
        {/* <View style={[styles.statusBadge, {backgroundColor: ChipColors.Hot}]}>
          <Text style={styles.statusText}>{'Hot'}</Text>
        </View> */}

        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.clientId}</Text> {data.id ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.firmName}</Text>
          {data.firm_name ? decryptLocation(data.firm_name) || 'N/A' : 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.clientName}</Text>
          {data.client_name
            ? decryptLocation(data.client_name) || 'N/A'
            : 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.location}</Text>
          {data.city ? decryptConditionally(data.city) || 'N/A' : 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.initiator}</Text>
          {data.user
            ? `${data.user.first_name ?? ''} ${
                data.user.last_name ?? ''
              }`.trim() || 'N/A'
            : 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.sourceDHCO}</Text>
          {data.source_of_lead || 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.referenceDetails}</Text>
          {data.reference_details || 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Bank Name :</Text>
          {data.bank_name ? decryptLocation(data.bank_name) || 'N/A' : 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Existing Funding Sanctioned Amount :</Text>
          {data.existing_funding_sanctioned_amount ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>
            Unit of Measure as "Credit Period Offer (in days):"
          </Text>
          {data.credit_period_offer ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.sanctionRequested}</Text>
          {data.estimated_funding_required ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.monthlyTurnover}</Text>
          {data.monthly_turnover || 'N/A'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.readMoreButton}
        onPress={() => {
          console.log(
            'API URL:',
            `${process.env.API_URL || 'https://losapidev.cashntech.com'}/client-info-master/details/${data.id}`,
            'Method: GET'
          );
          onPressReadMore(data.id);
        }}>
        <Text style={styles.readMoreText}>{Strings.readMore}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  threeDotsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 20,
  },
  menuText: {
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    color: '#515151',
    marginBottom: 6,
  },
  bold: {
    fontWeight: 'bold',
  },
  readMoreButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  readMoreText: {
    color: Colors.tertiaryBlue,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 4,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
