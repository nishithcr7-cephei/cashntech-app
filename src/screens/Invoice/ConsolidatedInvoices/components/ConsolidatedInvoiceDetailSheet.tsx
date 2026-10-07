import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getInvoiceStatusStyles} from '@utils/invoiceStatusDisplay';
import type {ConsolidatedInvoiceRow} from '@store/consolidatedInvoice/consolidatedInvoice.types';

type Props = {
  row: ConsolidatedInvoiceRow | null;
  onClose: () => void;
};

type Field = {label: string; value: string};

const Section: React.FC<{title: string; fields: Field[]}> = ({title, fields}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {fields.map(field => (
      <View key={field.label} style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <Text style={styles.fieldValue} selectable>
          {field.value || '-'}
        </Text>
      </View>
    ))}
  </View>
);

export const ConsolidatedInvoiceDetailSheet: React.FC<Props> = ({row, onClose}) => {
  const statusStyle = getInvoiceStatusStyles(row?.invoiceStatus ?? '');

  return (
    <Modal
      visible={!!row}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {row ? (
            <>
              <View style={styles.handle} />
              <View style={styles.titleRow}>
                <View style={styles.titleText}>
                  <Text style={styles.title} numberOfLines={2} selectable>
                    {row.invoiceNo}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {row.productName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {backgroundColor: statusStyle.backgroundColor},
                  ]}>
                  <Text
                    style={[styles.statusText, {color: statusStyle.color}]}
                    numberOfLines={1}>
                    {row.invoiceStatus}
                  </Text>
                </View>
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}>
                <Section
                  title="Invoice"
                  fields={[
                    {label: 'Loan Ref No.', value: row.loanRefNo},
                    {label: 'Invoice No', value: row.invoiceNo},
                    {label: 'Product', value: row.productName},
                    {label: 'Bank', value: row.bankName},
                    {label: 'Program', value: row.programName},
                  ]}
                />
                <Section
                  title="Parties"
                  fields={[
                    {label: row.primaryPartyLabel, value: row.primaryPartyName},
                    {label: row.counterPartyLabel, value: row.counterPartyName},
                  ]}
                />
                <Section
                  title="Dates"
                  fields={[
                    {label: 'Upload Date', value: row.uploadDate},
                    {label: 'Invoice Date', value: row.invoiceDate},
                    {label: 'GRN Date', value: row.grnDate},
                    {label: 'Due Date', value: row.dueDate},
                  ]}
                />
                <Section
                  title="Amounts (₹)"
                  fields={[
                    {label: 'Invoice Amount', value: row.invoiceAmount},
                    {
                      label: 'Disbursement Requested',
                      value: row.disbursementRequestedAmount,
                    },
                    {label: 'Net Disbursement', value: row.netDisbursementAmount},
                  ]}
                />
                <Section
                  title="Status"
                  fields={[
                    {label: 'Invoice Status', value: row.invoiceStatus},
                    {label: 'Approval Status', value: row.approvalStatus},
                    {label: 'Admin Status', value: row.adminStatus},
                    {label: 'Current Step', value: row.currentStep},
                  ]}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.7}
                onPress={onClose}
                accessibilityRole="button">
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: scaleHeight(20),
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: scaleWidth(40),
    height: scaleHeight(4),
    borderRadius: scaleWidth(2),
    backgroundColor: '#E0E0E0',
    marginBottom: scaleHeight(12),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(8),
  },
  titleText: {
    flex: 1,
    marginRight: scaleWidth(10),
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  subtitle: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  statusPill: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    maxWidth: '45%',
  },
  statusText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingBottom: scaleHeight(8),
  },
  section: {
    marginTop: scaleHeight(12),
    borderRadius: scaleWidth(10),
    backgroundColor: '#F7F8FB',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
  },
  sectionTitle: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    marginBottom: scaleHeight(6),
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(4),
  },
  fieldLabel: {
    width: '42%',
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  fieldValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  closeButton: {
    marginTop: scaleHeight(14),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(10),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  closeText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
});
