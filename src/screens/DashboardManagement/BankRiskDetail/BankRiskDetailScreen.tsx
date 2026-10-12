import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {DashboardShell} from '../components/DashboardShell';
import {RiskKpiGrid} from '../components/RiskKpiCard';
import {DpdStackedBar} from '../components/DpdStackedBar';
import {ProductSummaryCard} from '../components/ProductSummaryCard';
import {RiskSearchBox} from '../components/RiskSearchBox';
import {FilterChips} from '../components/FilterChips';
import {RiskSection} from '../components/RiskSection';
import {BankPartyCard} from './BankPartyCard';
import {PARTY_FILTER_CHIPS} from './bankDetailKpis';
import {useBankRiskDetail} from './useBankRiskDetail';

export const BankRiskDetailScreen: React.FC = () => {
  const {
    navigation,
    bankName,
    data,
    kpis,
    parties,
    chip,
    setChip,
    searchText,
    setSearchText,
    loading,
    noExposure,
    refreshing,
    updating,
    error,
    onRefresh,
    onRetry,
    onBack,
    openParty,
  } = useBankRiskDetail();

  return (
    <DashboardShell
      navigation={navigation}
      title={`${bankName || 'Bank'} · Party Risk Profile`}
      count={data ? parties.length : undefined}
      loading={loading}
      refreshing={refreshing}
      updating={updating}
      error={error}
      isEmpty={noExposure}
      emptyText="No exposure found for this bank"
      onRefresh={onRefresh}
      onRetry={onRetry}
      onBack={onBack}>
      {data ? (
        <>
          <RiskKpiGrid items={kpis} />
          <DpdStackedBar buckets={data.dpdBuckets} />

          <RiskSection title="PRODUCTS" isEmpty={!data.productSummaries.length}>
            {data.productSummaries.map(summary => (
              <ProductSummaryCard key={summary.product} summary={summary} />
            ))}
          </RiskSection>

          <Text style={styles.sectionTitle}>PARTIES</Text>
          <RiskSearchBox
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by party name"
          />
          <FilterChips options={PARTY_FILTER_CHIPS} value={chip} onChange={setChip} />

          {parties.length ? (
            parties.map(party => (
              <BankPartyCard key={party.partyId} party={party} onPress={openParty} />
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No data</Text>
            </View>
          )}
        </>
      ) : null}
    </DashboardShell>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: scaleHeight(6),
    marginBottom: scaleHeight(8),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    letterSpacing: 0.8,
    color: '#5B6470',
  },
  empty: {alignItems: 'center', paddingVertical: scaleHeight(32)},
  emptyText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
