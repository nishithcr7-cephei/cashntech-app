import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatRiskDate} from '@utils/riskFormat';
import {DashboardShell} from '../components/DashboardShell';
import {RiskKpiGrid} from '../components/RiskKpiCard';
import {DpdStackedBar} from '../components/DpdStackedBar';
import {RiskSection} from '../components/RiskSection';
import {PartyProgramCard} from './PartyProgramCard';
import {DpdHistoryChart} from './DpdHistoryChart';
import {usePartyRiskProfile} from './usePartyRiskProfile';

export const PartyRiskProfileScreen: React.FC = () => {
  const {
    navigation,
    partyName,
    data,
    kpis,
    subtitle,
    loading,
    refreshing,
    updating,
    error,
    onRefresh,
    onRetry,
    onBack,
  } = usePartyRiskProfile();

  return (
    <DashboardShell
      navigation={navigation}
      title={partyName || 'Party Risk Profile'}
      loading={loading}
      refreshing={refreshing}
      updating={updating}
      error={error}
      isEmpty={!data}
      emptyText="No exposure found for this party"
      onRefresh={onRefresh}
      onRetry={onRetry}
      onBack={onBack}>
      {data ? (
        <>
          <View style={styles.identity}>
            {data.role ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{data.role}</Text>
              </View>
            ) : null}
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <RiskKpiGrid items={kpis} />
          <DpdStackedBar buckets={data.dpdBuckets} />

          <RiskSection
            title="PROGRAMS ACROSS THE ECOSYSTEM"
            isEmpty={!data.programs.length}>
            {data.programs.map((program, index) => (
              <PartyProgramCard
                key={`${program.bankId}-${program.programName}-${index}`}
                program={program}
              />
            ))}
          </RiskSection>

          <RiskSection title="LINKED PARTIES" isEmpty={!data.linked.length}>
            <View style={styles.listCard}>
              {data.linked.map((entity, index) => (
                <View
                  key={`${entity.name}-${entity.note}-${index}`}
                  style={[styles.listRow, index > 0 && styles.listDivider]}>
                  <View style={styles.listTextBox}>
                    <Text style={styles.listTitle} numberOfLines={2}>
                      {entity.name || '-'}
                    </Text>
                    <Text style={styles.listMeta} numberOfLines={2}>
                      {[entity.relationship, entity.note].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  {entity.flagged ? (
                    <Text style={styles.flagged}>Overdue</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </RiskSection>

          <RiskSection title="ALERTS RAISED" isEmpty={!data.alerts.length}>
            <View style={styles.listCard}>
              {data.alerts.map((alert, index) => (
                <View
                  key={`${alert.date}-${alert.what}-${index}`}
                  style={[styles.listRow, index > 0 && styles.listDivider]}>
                  <View style={styles.listTextBox}>
                    <Text style={styles.listTitle} numberOfLines={2}>
                      {alert.what || '-'}
                    </Text>
                    {alert.who ? (
                      <Text style={styles.listMeta} numberOfLines={2}>
                        {alert.who}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.listDate}>{formatRiskDate(alert.date)}</Text>
                </View>
              ))}
            </View>
          </RiskSection>

          <RiskSection
            title="REPAYMENT BEHAVIOUR · LAST 12 MONTHS"
            isEmpty={!data.history.length}
            emptyText="No DPD history yet">
            <DpdHistoryChart history={data.history} />
          </RiskSection>
        </>
      ) : null}
    </DashboardShell>
  );
};

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: scaleHeight(10),
  },
  roleBadge: {
    marginRight: scaleWidth(8),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(10),
    backgroundColor: '#FFE5E5',
  },
  roleText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  subtitle: {
    flexShrink: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
  },
  listCard: {
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
  },
  listDivider: {borderTopWidth: 1, borderTopColor: '#F0F2F5'},
  listTextBox: {flex: 1, minWidth: 0, marginRight: scaleWidth(8)},
  listTitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  listMeta: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  listDate: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
  },
  flagged: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: '#B5442F',
  },
});
