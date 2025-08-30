/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';
import {useNavigation} from '@react-navigation/native';
import fontWeight from '@constants/FontWeight';
import {scaleHeight, scaleFont} from '@utils/Scale';
import {RightCheckmark} from '@assets/Icons';

interface KycValidationCardProps {
  documentName: string;
  nameasperPanCard: string;
  panNumber: string;
  dateofBirth: string;
  status: string;
}

export const PersonalKYCValidationCard: React.FC<KycValidationCardProps> = ({
  documentName,
  nameasperPanCard,
  panNumber,
  dateofBirth,
  status,
}) => {
  const navigation = useNavigation();

  const getButtonContent = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return {
          label: 'Send for Review',
          color: Colors.white,
          textColor: Colors.primaryColor,
          borderColor: Colors.primaryColor,
        };
      case 'validate':
        return {
          label: 'Validated',
          color: Colors.green,
          textColor: Colors.white,
        };
      case 'rejected':
        return {
          label: 'Retry',
          color: Colors.primaryColor,
          textColor: Colors.white,
        };
      case '-':
        return {
          label: 'Validate',
          color: Colors.white,
          textColor: Colors.green,
          borderColor: Colors.green,
        };
      default:
        return {
          label: 'Under Verification',
          color: Colors.white,
          textColor: Colors.graybase,
          borderColor: Colors.gray600,
        };
    }
  };

  const {label, color, textColor, borderColor} = getButtonContent(status);

  return (
    <View style={styles.card}>
      {[
        {label: 'Document Name', value: documentName},
        {label: 'Name as Per PAN Card', value: nameasperPanCard},
        {label: 'PAN Number', value: panNumber},
        {
          label: 'Data of Birth',
          value: dateofBirth,
        },
        {label: 'Status', value: status},
      ].map((item, index) => (
        <Text style={styles.text} key={index}>
          <Text style={styles.label}>{item.label}: </Text>
          {item.value}
        </Text>
      ))}
      <TouchableOpacity
        style={[
          styles.button,
          {backgroundColor: color},
          {
            borderColor: borderColor ?? 'transparent',
            borderWidth: borderColor ? 1 : 0,
          },
        ]}>
        <Text style={[styles.buttonText, {color: textColor}]}>{label}</Text>
        {status.toLowerCase() === 'validate' && (
          <RightCheckmark width={11} height={11} />
        )}
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
  text: {
    color: '#555',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    marginTop: scaleHeight(12),
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.green,
  },
  buttonText: {
    color: Colors.LimeGray,
    fontWeight: fontWeight.SemiBold,
    fontSize: scaleFont(16),
    marginRight: 10,
  },
});
