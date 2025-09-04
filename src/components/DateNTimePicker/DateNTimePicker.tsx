import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import DateTimePickerModal, {
  ReactNativeModalDateTimePickerProps,
} from 'react-native-modal-datetime-picker';
import moment from 'moment';
import {Calender} from '@assets/Icons/Calender';
import {Colors} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

interface DateTimePickerProps {
  datePickerProps?: Omit<
    Partial<ReactNativeModalDateTimePickerProps>,
    'onConfirm' | 'isVisible' | 'onCancel'
  >;
  label: string;
  onConfirm?: (date: Date) => void;
  value?: string | Date;
  placeholder?: string;
  containerStyle?: ViewStyle;
  mode?: 'date' | 'datetime';
}

export const DateNTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  onConfirm,
  placeholder = 'Select Date',
  value = '',
  datePickerProps,
  containerStyle,
  mode = 'datetime',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const showPicker = () => setIsVisible(true);
  const hidePicker = () => setIsVisible(false);

  const handleConfirm = (date: Date) => {
    setIsVisible(false);
    onConfirm?.(date);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={showPicker} style={styles.inputBox}>
        <View style={styles.inputRow}>
          {value ? (
            <Text style={styles.inputText}>
              {typeof value === 'string'
                ? value
                : mode === 'date'
                ? moment(value).format('DD-MM-YYYY')
                : moment(value).format('DD-MM-YYYY hh:mm A')}
            </Text>
          ) : (
            <Text style={styles.inputPlaceholder}>{placeholder}</Text>
          )}
          <Calender width={16} height={16} style={{marginLeft: 8}} />
        </View>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isVisible}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        mode={mode === 'date' ? 'date' : 'datetime'}
        {...datePickerProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scaleHeight(4),
  },
  label: {
    fontSize: scaleFont(14),
    marginBottom: 8,
    color: '#333',
  },
  inputBox: {
    padding: 12,
    borderRadius: scaleWidth(4),
    borderColor: Colors.gray300,
    borderWidth: scaleWidth(1.5),
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  inputPlaceholder: {
    fontSize: scaleFont(14),
    color: Colors.gray300,
  },
});
