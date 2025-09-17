import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import {Colors} from '@constants/index';

type RulesetViewProps = {
  // Accept any object and render its key/value pairs dynamically
  data: Record<string, any>;
};

export const RulesetViewCard: React.FC<RulesetViewProps> = ({data}) => {
  // Normalize and pretty-print label from key (e.g., final_limit -> Final Limit)
  const formatLabel = (key: string): string =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

  // Prepare ordered keys: try to keep 'method' first, then others
  const keys = Object.keys(data || {});
  const orderedKeys = [
    ...keys.filter(k => k === 'method'),
    ...keys.filter(k => k !== 'method'),
  ];

  return (
    <View style={styles.card}>
      {orderedKeys.map(key => (
        <Text key={key} style={styles.text}>
          <Text style={styles.label}>{formatLabel(key)} :</Text>{' '}
          {String(data[key])}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.LimeGray,
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
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'red',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'red',
    fontWeight: '600',
  },
});
