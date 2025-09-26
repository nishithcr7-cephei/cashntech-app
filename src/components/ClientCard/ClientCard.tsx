import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import React, {useState} from 'react';
import {Colors} from '@constants/index';
import {ClientsFilterResponseDatum} from '@store/client';
import {Dots} from '@assets/Icons';
import {scaleHeight, scaleWidth} from '@utils/Scale';
import moment from 'moment';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

const Strings = {
  clientId: 'Client ID : ',
  sector: 'Sector : ',
  firmName: 'Firm Name : ',
  location: 'City : ',
  initiator: 'Initiator : ',
  sourceDHCO: 'Source (D/H/C/O) : ',
  currentStatus: 'Current Status : ',
  existingFunding: 'Existing Funding Amount : ',
  estimatedFundingRequired: 'Estimated Funding Required : ',
  monthlyTurnover: 'Monthly Turnover : ',
  createdAt: 'Created At : ',
  readMore: 'Read more',
  edit: 'Edit',
  delete: 'Delete',
  assignTask: 'Assign Task',
};

type ClientCardProps = {
  data: ClientsFilterResponseDatum;
  onPressCard: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAssignTask?: (id: number) => void;
};

export const ClientCard: React.FC<ClientCardProps> = ({
  data,
  onPressCard,
  onEdit,
  onDelete,
  onAssignTask,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleOptionPress = (option: 'edit' | 'delete' | 'assignTask') => {
    setMenuVisible(false);
    if (option === 'edit') {
      if (onEdit) onEdit(data.id);
      setMenuVisible(false);
    }
    if (option === 'delete') {
      Alert.alert('Are you sure to delete?', "This can't be undone.", [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setMenuVisible(false);
            if (onDelete) {
              onDelete(data.id);
              return;
            }
          },
        },
      ]);
    }
    if (option === 'assignTask') {
      if (onAssignTask) onAssignTask(data.id);
      setMenuVisible(false);
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
          <TouchableOpacity
            onPress={() => handleOptionPress('edit')}
            style={styles.menuLabel}>
            <FontAwesome6
              name="pencil"
              iconStyle="solid"
              color={'#333'}
              size={16}
            />
            <Text style={styles.menuText}>{Strings.edit}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleOptionPress('delete')}
            style={styles.menuLabel}>
            <FontAwesome6
              name="trash"
              iconStyle="solid"
              color={Colors.primaryColor}
              size={16}
            />
            <Text style={[styles.menuText, {color: Colors.primaryColor}]}>
              {Strings.delete}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleOptionPress('assignTask')}
            style={styles.menuLabel}>
            <FontAwesome6
              name="list-check"
              iconStyle="solid"
              color={Colors.tertiaryBlue}
              size={16}
            />
            <Text style={[styles.menuText, {color: Colors.tertiaryBlue}]}>
              {Strings.assignTask}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={() => onPressCard(data.id)}
        activeOpacity={0.7}>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.clientId}</Text> {data.id ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.firmName}</Text>
          {data.firm_name ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.sector}</Text>
          {data.sector ? data.sector : 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.location}</Text>
          {data.city ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.initiator}</Text>
          {data.user
            ? `${data.user.first_name ?? ''} ${
                data.user.last_name ?? ''
              }`.trim()
            : 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.sourceDHCO}</Text>
          {data.source_of_lead || 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.currentStatus}</Text>
          {data.leadProgress?.[0]?.lead_progress_status ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.existingFunding}</Text>
          {data.existing_funding_sanctioned_amount ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.estimatedFundingRequired}</Text>
          {data.estimated_funding_required ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.monthlyTurnover}</Text>
          {data.monthly_turnover ?? 'N/A'}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>{Strings.createdAt}</Text>
          {data.created_at
            ? moment(data.created_at).format('MMMM YYYY')
            : 'N/A'}
        </Text>
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
    top: 50,
    right: 20,
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
  menuLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuText: {
    paddingVertical: 6,
    fontSize: 16,
    color: '#333',
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
  deleteButtonText: {
    color: Colors.primaryColor,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
