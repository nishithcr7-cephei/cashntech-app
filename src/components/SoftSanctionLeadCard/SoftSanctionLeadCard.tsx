import {Input} from '@components/Input/Input';
import fontWeight from '@constants/FontWeight';
import {Colors} from '@constants/index';
import {scaleFont, scaleHeight} from '@utils/Scale';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions} from '@store/client';
import {
  getSoftSanctionFields,
  getSoftSanctionFieldsLoading,
  getSoftSanctionFieldsError,
} from '@store/client/client.selector';
import clientApi from '@services/api/client.api';
import {Config} from '@config/index';
import Endpoints from '@constants/ApiEndPoints';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {decryptUtility} from '@utils/crypto';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type LeadProps = {
  lead: {
    clientId: string;
    clientName: string;
    location: string;
    initiator: string;
    turnover: string;
    creditPeriod: string;
  };
  bankName: string;
  productName: string;
  methodName: string;
  rulesetId: string;
};

export const LeadCard: React.FC<LeadProps> = ({
  lead,
  bankName,
  productName,
  methodName,
  rulesetId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({
    'Existing W/C Limits': '10000000',
    Stock: '13207177',
    'Debtors (upto 150 days)': '3438200',
    'Less Creditors': '2160108',
    'Last 12 M Purchases of brand 1': '405282552',
  });
  const dispatch = useDispatch();
  const navigation = useNavigation<SoftInfoNavigationType>();
  const fields = useSelector(getSoftSanctionFields) || {};
  const loading = useSelector(getSoftSanctionFieldsLoading);
  const error = useSelector(getSoftSanctionFieldsError);

  const handleOpenModal = () => {
    setShowModal(true);
    dispatch(clientActions.getSoftSanctionFields({bankName, productName}));
  };

  const handleInputChange = (id: string, value: string) => {
    setInputValues(prev => ({...prev, [id]: value}));
  };

  const handleRun = async () => {
    const payload: any = {
      bank_name: bankName,

      'Existing W/C Limits': Number(inputValues['Existing W/C Limits'] || 0),
      Stock: Number(inputValues['Stock'] || 0),
      'Debtors (upto 150 days)': Number(
        inputValues['Debtors (upto 150 days)'] || 0,
      ),
      'Less Creditors': Number(inputValues['Less Creditors'] || 0),
      'Last 12 M Purchases of brand 1': Number(
        inputValues['Last 12 M Purchases of brand 1'] || 0,
      ),
      Dependency: 0.9884,
    };

    const apiUrl = `${Config.API_URL}${Endpoints.apiSoftSanctionCalculate(
      lead.clientId,
    )}`;

    try {
      const res = await clientApi.softSanctionCalculate(payload, lead.clientId);
      console.log('Soft sanction API response:', res);

      setShowModal(false);
      dispatch(clientActions.clearSoftSanctionFields());
      navigation.navigate('RulesetView', {
        rulesetData: res?.data?.data || [],
        location: lead.location ? decryptUtility(lead.location) : '',
        clientName: lead.clientName || '',
        clientId: lead.clientId,
      });
    } catch (e) {
      console.log('Soft sanction API error:', e);

      Alert.alert('API Error', `Error: ${JSON.stringify(e, null, 2)}`, [
        {
          text: 'OK',
          onPress: () => {
            setShowModal(false);
            dispatch(clientActions.clearSoftSanctionFields());
          },
        },
      ]);
    }
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.text}>
          <Text style={styles.label}>Client ID :</Text> {lead.clientId}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Client Name :</Text> {lead.clientName}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>City :</Text>{' '}
          {lead.location ? decryptUtility(lead.location) : ''}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Initiator :</Text> {lead.initiator}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Monthly Turnover :</Text> {lead.turnover}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Credit Period :</Text> {lead.creditPeriod}
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleOpenModal}>
          <Text style={styles.buttonText}>Run Soft Sanction</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Run Soft Sanction</Text>
            <Text style={styles.modalSubtitle}>
              {loading
                ? 'Loading fields...'
                : error
                ? error
                : 'Enter values for the following fields:'}
            </Text>
            {!loading &&
              !error &&
              typeof fields === 'object' &&
              Object.keys(fields).length > 0 &&
              Object.keys(fields).map(method => (
                <View key={method} style={styles.modalSection}>
                  <Text style={styles.modalLabel}>{method}</Text>
                  {(fields as Record<string, any[]>)[method].map(
                    (field: any) => (
                      <View key={field.id} style={{marginBottom: 10}}>
                        <Text style={styles.modalSubLabel}>{field.label}</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder={`Enter value for ${field.label}`}
                          keyboardType="numeric"
                          value={inputValues[field.id]}
                          onChangeText={val => handleInputChange(field.id, val)}
                        />
                      </View>
                    ),
                  )}
                </View>
              ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  dispatch(clientActions.clearSoftSanctionFields());
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.runBtn} onPress={handleRun}>
                <Text style={styles.runText}>Run</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginVertical: 10,
    padding: 16,
    borderRadius: 8,
    borderColor: '#eee',
    borderWidth: 1,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  text: {
    color: '#555',
    marginBottom: 4,
  },
  button: {
    marginTop: scaleHeight(12),
    borderWidth: 1,
    borderColor: 'red',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: Colors.primaryColor,
    fontWeight: fontWeight.SemiBold,
    fontSize: scaleFont(16),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  modalSubLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelText: {
    marginRight: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  runBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  runText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    marginLeft: 4,
  },
});
