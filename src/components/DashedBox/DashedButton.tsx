import {Upload} from '@assets/Icons';
import Colors from '@constants/Colors';
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type UploadButtonProps = {
  label: string;
  onPress?: () => void;
  containerStyle?: ViewStyle;
};

export const DashedButton: React.FC<UploadButtonProps> = ({
  label,
  onPress,
  containerStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}>
      <View style={styles.buttonContent}>
        <Upload width={18} height={13} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#B0B0B0',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.LimeGray,
    marginTop: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: Colors.graybase,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
});
