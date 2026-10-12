import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {DashboardShell} from '../components/DashboardShell';
import {RiskKpiGrid} from '../components/RiskKpiCard';
import {DpdStackedBar} from '../components/DpdStackedBar';
import {RiskSearchBox} from '../components/RiskSearchBox';
import {EcosystemBankCard} from './EcosystemBankCard';
import {useEcosystemRisk} from './useEcosystemRisk';

export const EcosystemRiskProfileScreen: React.FC = () => {
  const {
    navigation,
    data,
    kpis,
    dpdBuckets,
    rows,
    totalBanks,
    searchText,
    setSearchText,
    loading,
    refreshing,
    updating,
    error,
    onRefresh,
    onRetry,
    openBank,
  } = useEcosystemRisk();

  return (
    <DashboardShell
      navigation={navigation}
      title="Ecosystem Risk Profile"
      loading={loading}
      refreshing={refreshing}
      updating={updating}
      error={error}
      isEmpty={!data}
      onRefresh={onRefresh}
      onRetry={onRetry}>
      <RiskKpiGrid items={kpis} />
      <DpdStackedBar buckets={dpdBuckets} />

      <Text style={styles.sectionTitle}>
        BANKS <Text style={styles.sectionCount}>({totalBanks})</Text>
      </Text>
      <RiskSearchBox
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by bank name"
      />

      {rows.length ? (
        rows.map(row => (
          <EcosystemBankCard key={row.bankId} row={row} onPress={openBank} />
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {searchText ? 'No bank matches your search' : 'No data'}
          </Text>
        </View>
      )}
    </DashboardShell>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(8),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    letterSpacing: 0.8,
    color: '#5B6470',
  },
  sectionCount: {
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: scaleHeight(32),
  },
  emptyText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
