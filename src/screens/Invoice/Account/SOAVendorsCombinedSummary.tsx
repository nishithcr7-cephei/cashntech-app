import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type VendorsCombinedTotals = {
  totalOsAmount: number;
  utilizedAmount: number;
  availableLimit: number;
  sanctionLimit: number;
  pipelineRequests: number;
  excessCredit: number;
  totalAmountPaid: number;
};

type SOAVendorsCombinedSummaryProps = {
  partyLabelPlural: string;
  totals: VendorsCombinedTotals;
  formatInr: (n: number) => string;
};

type KpiTile = {
  label: string;
  value: number;
  highlight?: boolean;
};

const SOAVendorsCombinedSummary: React.FC<SOAVendorsCombinedSummaryProps> = ({
  partyLabelPlural,
  totals,
  formatInr,
}) => {
  const [sheetVisible, setSheetVisible] = useState(false);

  const secondaryRows = [
    {label: 'Pipeline Requests', value: totals.pipelineRequests},
    {label: 'Excess Credit', value: totals.excessCredit},
    {label: 'Total Amount Paid', value: totals.totalAmountPaid},
  ];

  const primaryTiles: KpiTile[] = [
    {label: 'Total O/S Amount', value: totals.totalOsAmount, highlight: true},
    {label: 'Utilized Amount', value: totals.utilizedAmount, highlight: true},
  ];

  const allBreakdownRows: KpiTile[] = [
    ...primaryTiles,
    {label: 'Available Limit', value: totals.availableLimit},
    {label: 'Sanction Limit', value: totals.sanctionLimit},
    ...secondaryRows.map(r => ({label: r.label, value: r.value})),
  ];

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={styles.sectionTitle}>
          All {partyLabelPlural} combined
        </Text>
        <View style={styles.kpiGrid}>
          {primaryTiles.map(tile => (
            <View
              key={tile.label}
              style={[styles.kpiTile, tile.highlight && styles.kpiTileHighlight]}>
              <Text style={styles.kpiLabel} numberOfLines={2}>
                {tile.label}
              </Text>
              <Text
                style={[styles.kpiValue, tile.highlight && styles.kpiValueHighlight]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                {formatInr(tile.value)}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          activeOpacity={0.7}
          onPress={() => setSheetVisible(true)}>
          <Text style={styles.viewAllText}>View all totals</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Detailed breakdown</Text>
            <Text style={styles.sheetSubtitle}>
              Combined totals across all {partyLabelPlural.toLowerCase()}
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}>
              {allBreakdownRows.map(row => (
                <View key={row.label} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{row.label}</Text>
                  <Text style={styles.breakdownValue}>{formatInr(row.value)}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSheetVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default SOAVendorsCombinedSummary;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(8),
    borderWidth: 1,
    borderColor: '#FFD9D9',
  },
  sectionTitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: scaleWidth(10),
  },
  kpiTile: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(10),
    borderWidth: 1,
    borderColor: '#FFE8E8',
    minWidth: 0,
  },
  kpiTileHighlight: {
    borderColor: Colors.primaryColor,
    backgroundColor: '#FFF0F0',
  },
  kpiLabel: {
    fontSize: scaleFont(11),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
    marginBottom: scaleHeight(6),
  },
  kpiValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  kpiValueHighlight: {
    color: Colors.primaryColor,
    fontSize: scaleFont(15),
  },
  viewAllBtn: {
    marginTop: scaleHeight(10),
    alignSelf: 'flex-start',
    paddingVertical: scaleHeight(4),
  },
  viewAllText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(16),
    borderTopRightRadius: scaleWidth(16),
    paddingTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: scaleWidth(40),
    height: scaleHeight(4),
    borderRadius: scaleWidth(2),
    backgroundColor: '#E0E0E0',
    marginBottom: scaleHeight(12),
  },
  sheetTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  sheetSubtitle: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(12),
  },
  sheetContent: {
    paddingBottom: scaleHeight(8),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
    gap: scaleWidth(12),
  },
  breakdownLabel: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  breakdownValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    textAlign: 'right',
    flexShrink: 1,
  },
  closeBtn: {
    marginTop: scaleHeight(12),
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
});
