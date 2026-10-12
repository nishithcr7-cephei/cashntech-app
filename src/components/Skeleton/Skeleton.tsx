import React, {createContext, useContext, useEffect, useRef} from 'react';
import {Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {Colors} from '@constants/index';
import {scaleHeight, scaleWidth} from '@utils/Scale';

export type SkeletonVariant = 'card' | 'grid' | 'kpi' | 'row';

const PulseContext = createContext<Animated.Value | null>(null);

/** One looping opacity value; share it so every block on a screen pulses together. */
export const useSkeletonPulse = (): Animated.Value => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 1, duration: 700, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0.4, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
};

type BlockProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Grey placeholder block. Inside `SkeletonList` it uses the shared pulse; standalone it pulses itself. */
export const SkeletonBlock: React.FC<BlockProps> = ({
  width = '100%',
  height = scaleHeight(12),
  radius = scaleWidth(4),
  style,
}) => {
  const shared = useContext(PulseContext);
  return shared ? (
    <Animated.View
      style={[styles.block, {width, height, borderRadius: radius, opacity: shared}, style]}
    />
  ) : (
    <StandaloneBlock width={width} height={height} radius={radius} style={style} />
  );
};

const StandaloneBlock: React.FC<Required<Omit<BlockProps, 'style'>> & {style?: StyleProp<ViewStyle>}> = ({
  width,
  height,
  radius,
  style,
}) => {
  const opacity = useSkeletonPulse();
  return (
    <Animated.View
      style={[styles.block, {width, height, borderRadius: radius, opacity}, style]}
    />
  );
};

const CardItem = () => (
  <View style={styles.card}>
    <View style={styles.spaceBetween}>
      <SkeletonBlock width="55%" height={scaleHeight(14)} />
      <SkeletonBlock width={scaleWidth(56)} height={scaleHeight(16)} radius={scaleWidth(8)} />
    </View>
    <SkeletonBlock width="40%" height={scaleHeight(10)} style={styles.subtitle} />
    <View style={styles.spaceBetween}>
      <SkeletonBlock width="42%" height={scaleHeight(16)} />
      <SkeletonBlock width="42%" height={scaleHeight(16)} />
    </View>
  </View>
);

const GridItem = () => (
  <View style={styles.card}>
    <SkeletonBlock width="60%" height={scaleHeight(14)} />
    <View style={styles.grid}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <View key={i} style={styles.gridCell}>
          <SkeletonBlock width="55%" height={scaleHeight(9)} />
          <SkeletonBlock width="80%" height={scaleHeight(13)} style={styles.gridValue} />
        </View>
      ))}
    </View>
  </View>
);

const KpiItem = () => (
  <View style={styles.kpiTile}>
    <SkeletonBlock width="60%" height={scaleHeight(10)} />
    <SkeletonBlock width="80%" height={scaleHeight(18)} style={styles.kpiValue} />
  </View>
);

const RowItem = () => (
  <View style={[styles.row, styles.spaceBetween]}>
    <SkeletonBlock width="50%" height={scaleHeight(12)} />
    <SkeletonBlock width="25%" height={scaleHeight(12)} />
  </View>
);

const ITEMS: Record<SkeletonVariant, React.FC> = {
  card: CardItem,
  grid: GridItem,
  kpi: KpiItem,
  row: RowItem,
};

type ListProps = {
  variant?: SkeletonVariant;
  count?: number;
  style?: StyleProp<ViewStyle>;
};

/** Placeholder list shown on the first load of list / card content (not for pagination or actions). */
export const SkeletonList: React.FC<ListProps> = ({variant = 'card', count = 4, style}) => {
  const pulse = useSkeletonPulse();
  const Item = ITEMS[variant];
  return (
    <PulseContext.Provider value={pulse}>
      <View
        style={[variant === 'kpi' && styles.kpiGrid, style]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading">
        {Array.from({length: count}, (_, i) => (
          <Item key={i} />
        ))}
      </View>
    </PulseContext.Provider>
  );
};

const styles = StyleSheet.create({
  block: {backgroundColor: '#E6E9EE'},
  card: {
    padding: scaleWidth(12),
    marginBottom: scaleHeight(10),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {marginTop: scaleHeight(8), marginBottom: scaleHeight(12)},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleHeight(12),
  },
  gridCell: {width: '50%', marginBottom: scaleHeight(10)},
  gridValue: {marginTop: scaleHeight(5)},
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiTile: {
    width: '48.5%',
    padding: scaleWidth(12),
    marginBottom: scaleHeight(8),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  kpiValue: {marginTop: scaleHeight(8)},
  row: {
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
});
