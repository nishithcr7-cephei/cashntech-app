import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Dots} from '@assets/Icons';
import type {InvoiceRow} from './types';

type Props = {
  row: InvoiceRow;
  isDealerMaker: boolean;
  isDealerChecker: boolean;
  isAnchorChecker: boolean;
  isSelected: boolean;
  onMenuToggle: (id: string) => void;
  onToggleSelection: (id: string) => void;
  registerMenuRef: (id: string, ref: View | null) => void;
};

export const InvoiceDetailsCard: React.FC<Props> = ({
  row,
  isDealerMaker,
  isDealerChecker,
  isAnchorChecker,
  isSelected,
  onMenuToggle,
  onToggleSelection,
  registerMenuRef,
}) => {
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.listCard}>
        {/* 3-dot action menu - only for Checker roles */}
        {(isDealerChecker || isAnchorChecker) && (
          <View
            ref={(r: View | null) => registerMenuRef(row.id, r)}
            collapsable={false}
            style={styles.threeDotsButton}>
            <TouchableOpacity
              onPress={() => onMenuToggle(row.id)}
              activeOpacity={0.7}
              hitSlop={10}
              style={styles.threeDotsTouchable}>
              <Dots
                width={scaleWidth(20)}
                height={scaleHeight(20)}
                style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardHeaderContainer}>
          {(isDealerChecker || isAnchorChecker) ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dmCardHeaderRow}
              onPress={() => onToggleSelection(row.id)}>
              <View
                style={[
                  styles.checkboxBox,
                  isSelected && styles.checkboxBoxSelected,
                ]}>
                {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <View style={styles.dmCardHeaderTextWrap}>
                <Text style={styles.primaryPartyLabel}>Primary Party (Anchors)</Text>
                <Text style={styles.cardTitle}>{row.dealerName}</Text>
                <Text style={styles.cardSubtitle}>
                  Invoice No: {row.invoiceNo}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.primaryPartyLabel}>Primary Party (Anchors)</Text>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{row.dealerName}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Invoice No: {row.invoiceNo}
              </Text>
            </>
          )}
        </View>

        {/* Columns aligned with web: Loan Ref No., Invoice No, Bank Name, Product Name, Program Name, Primary Party, Counter Party, Invoice Amount (₹), Invoice Date, Request Date, Due Date, Invoice Status, Approval Status, Admin Status */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Loan Ref No.</Text>
            <Text style={styles.infoValue}>{row.loanRefNo}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice No</Text>
            <Text style={styles.infoValue}>{row.invoiceNo}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{row.bankName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Product Name</Text>
            <Text style={styles.infoValue}>{row.productName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Program Name</Text>
            <Text style={styles.infoValue}>{row.programName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Primary Party</Text>
            <Text style={styles.infoValue}>{row.primaryParty}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Counter Party</Text>
            <Text style={styles.infoValue}>{row.counterParty}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
            <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{row.invoiceDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Request Date</Text>
            <Text style={styles.infoValue}>{row.requestDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{row.dueDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Status</Text>
            <Text style={[styles.infoValue, styles.statusGreen]}>{row.invoiceStatus}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Approval Status</Text>
            <Text style={[styles.infoValue, styles.statusGreen]}>{row.approvalStatus}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Admin Status</Text>
            <Text style={[styles.infoValue, styles.statusGreen]}>{row.adminStatus}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderContainer: {
    marginBottom: scaleHeight(12),
    paddingRight: scaleWidth(50), // Space for 3-dot button when visible (Checker roles)
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  dmCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(4),
  },
  dmCardHeaderTextWrap: {
    flex: 1,
    marginLeft: scaleWidth(8),
  },
  checkboxBox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(12),
  },
  primaryPartyLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(2),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardSubtitle: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginTop: scaleHeight(4),
  },
  statusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  infoColumn: {
    width: '47%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(12),
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  threeDotsTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
