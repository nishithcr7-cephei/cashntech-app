import {Input} from '@components/Input/Input';
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';

export const SoftSanctionModal = ({visible, onClose, onRun}) => {
  const [purchaseValue, setPurchaseValue] = useState('');
  const [turnoverValue, setTurnoverValue] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Run Soft Sanction</Text>
          <Text style={styles.subtitle}>
            Rulesets (1) for Turnover method (SBI, DF)
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>Purchases</Text>
            <Text style={styles.inputLabel}>
              Last 12 M Purchases of brand 1 (GSTMar24)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter value"
              value={purchaseValue}
              onChangeText={setPurchaseValue}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Turnover</Text>
            <Text style={styles.inputLabel}>Existing W/C Limits</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter value"
              value={turnoverValue}
              onChangeText={setTurnoverValue}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.runButton}
              onPress={() => {
                // Validation: Check if both fields are filled
                if (!purchaseValue.trim()) {
                  Toast.show({
                    type: 'error',
                    text1: 'Please enter Purchase value',
                  });
                  return;
                }
                
                if (!turnoverValue.trim()) {
                  Toast.show({
                    type: 'error',
                    text1: 'Please enter Turnover value',
                  });
                  return;
                }

                // If validation passes, call onRun
                onRun({purchaseValue, turnoverValue});
              }}>
              <Text style={styles.runText}>Run</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelText: {
    color: '#555',
    fontWeight: 'bold',
  },
  runButton: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 6,
  },
  runText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
