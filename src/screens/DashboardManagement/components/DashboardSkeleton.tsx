import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SkeletonList} from '@components/Skeleton/Skeleton';
import {scaleHeight} from '@utils/Scale';

type Props = {
  /** `dashboard` = KPI tiles + cards; `list` = cards only (toolbar already on screen). */
  variant?: 'dashboard' | 'list';
};

/** Placeholders shown while a dashboard loads for the first time. */
export const DashboardSkeleton: React.FC<Props> = ({variant = 'dashboard'}) => (
  <View>
    {variant === 'dashboard' ? (
      <SkeletonList variant="kpi" count={4} style={styles.kpis} />
    ) : null}
    <SkeletonList variant="card" count={4} />
  </View>
);

const styles = StyleSheet.create({
  kpis: {marginBottom: scaleHeight(6)},
});
