import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {dpdText, formatCr} from '@utils/riskFormat';
import type {BankRiskParty} from '@store/riskDashboard/riskDashboard.types';
import {StatusPill} from '../components/StatusPill';
import {shortProductName} from './bankDetailKpis';

type Props = {
  party: BankRiskParty;
  onPress: (party: BankRiskParty) => void;
};

export const BankPartyCard: React.FC<Props> = ({party, onPress}) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.7}
    onPress={() => onPress(party)}
    accessibilityRole="button"
    accessibilityLabel={`${party.partyName}, ${party.status}. Open party profile.`}>
    <View style={styles.headerRow}>
      <View style={styles.titleBox}>
        <Text style={styles.name} numberOfLines={2}>
          {party.partyName || '-'}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[party.city, party.role, party.products.map(shortProductName).join(', ')]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <StatusPill label={party.status} />
    </View>

    <View style={styles.metricsRow}>
      <View style={styles.metric}>
        <Text style={styles.label}>Outstanding</Text>
        <Text style={styles.value}>{formatCr(party.outstanding)}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.label}>DPD</Text>
        <Text style={[styles.value, party.currentDpd > 0 && styles.danger]}>
          {dpdText(party.currentDpd)}
        </Text>
      </View>
    </View>

    <View style={styles.footer}>
      <Text
        style={[styles.crossBank, party.crossBankFlagged && styles.danger]}
        numberOfLines={1}>
        {party.crossBankNote || '-'}
      </Text>
      <FontAwesome6
        name="chevron-right"
        iconStyle="solid"
        size={scaleFont(10)}
        color={Colors.primaryColor}
      />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    padding: scaleWidth(12),
    marginBottom: scaleHeight(8),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E9EE',
    backgroundColor: Colors.white,
  },
  headerRow: {flexDirection: 'row', alignItems: 'flex-start'},
  titleBox: {flex: 1, minWidth: 0, marginRight: scaleWidth(8)},
  name: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  meta: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  metricsRow: {flexDirection: 'row', marginTop: scaleHeight(10)},
  metric: {flex: 1},
  label: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  value: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  danger: {color: '#B5442F'},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(8),
    paddingTop: scaleHeight(8),
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  crossBank: {
    flex: 1,
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
  },
});
