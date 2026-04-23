import React from 'react';
import {View, ActivityIndicator} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors} from '@constants/index';
import {styles} from '../InvoiceDashboard.styles';
import type {MetricItem} from '../types';

interface MetricsCardProps {
  metrics: MetricItem[];
  loading: boolean;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({metrics, loading}) => {
  return (
    <View style={styles.cardGrid}>
      {metrics.map((metric, idx) => (
        <View
          key={idx}
          style={[
            styles.card,
            metric.label === 'Overdue Amount' && {flexBasis: '100%'},
          ]}>
          <Text style={styles.cardLabel}>{metric.label}</Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={Colors.primaryColor}
              style={styles.cardLoader}
            />
          ) : (
            <Text style={styles.cardValue}>{metric.value}</Text>
          )}

          {metric.subValues && metric.subValues.length > 0 && (
            <View style={styles.subValuesContainer}>
              {metric.subValues.map((sub, sIdx) => (
                <View key={sIdx} style={styles.subValueItem}>
                  <Text style={styles.subValueLabel}>{sub.label}</Text>
                  <Text style={styles.subValueText}>{sub.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};
