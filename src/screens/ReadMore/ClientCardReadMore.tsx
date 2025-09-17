import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {scaleFont} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';
import Colors from '@constants/Colors';
import {API_URL} from '@config/config';
import Endpoints from '@constants/ApiEndPoints';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector} from '@store/client';
import {decryptLocation} from '@utils/crypto';

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

type FieldProps = {
  label: string;
  value?: string;
};

export const ClientCardReadMore = ({
  onPressReadLess,
  clientId,
}: {
  onPressReadLess: () => void;
  clientId: number;
}) => {
  const dispatch = useDispatch();
  const client = useSelector(clientSelector.getClientDetails);
  const loading = useSelector(clientSelector.getClientDetailsLoading);
  const error = useSelector(clientSelector.getClientDetailsError);
  const [hasWaited, setHasWaited] = useState(false);

  useEffect(() => {
    console.log('ClientCardReadMore - Dispatching getClientDetails for ID:', clientId);
    console.log('ClientCardReadMore - Action available:', typeof clientActions.getClientDetails);
    dispatch(clientActions.getClientDetails(clientId));
    
    // Set a small delay to wait for data
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [clientId, dispatch]);

  useEffect(() => {
    console.log('ClientCardReadMore - Client Data:', client);
    console.log('ClientCardReadMore - Loading:', loading);
    console.log('ClientCardReadMore - Error:', error);
    console.log('ClientCardReadMore - Client ID:', clientId);
    console.log('ClientCardReadMore - Client exists:', !!client);
    console.log('ClientCardReadMore - Client keys:', client ? Object.keys(client) : 'No client');
    console.log('ClientCardReadMore - Client type:', typeof client);
    console.log('ClientCardReadMore - Client JSON:', JSON.stringify(client));
  }, [client, loading, error]);

  if (loading || !hasWaited) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.centerText}>Error: {error}</Text>
        </View>
      </View>
    );
  }
  if (!client) {
    console.log('ClientCardReadMore - No client data available');
    console.log('ClientCardReadMore - Current state:', { client, loading, error, clientId });
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.centerText}>No data found.</Text>
        </View>
      </View>
    );
  }

  // Additional check to ensure client has required properties
  if (client && typeof client === 'object' && !client.id) {
    console.log('ClientCardReadMore - Client data exists but missing ID:', client);
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.centerText}>Invalid client data.</Text>
        </View>
      </View>
    );
  }

  const val = (v: any) =>
    v !== undefined && v !== null && v !== '' ? v : 'N/A';
  
  const vendor =
    client.vendor && client.vendor.length > 0 ? client.vendor[0] : {};
  
  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatFinancialData = (amount: any) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const safeDecrypt = (value: any) => {
    if (!value) return 'N/A';
    
    // Check if the value looks like encrypted data (contains special characters, base64-like)
    const isEncrypted = /^[A-Za-z0-9+/=]+$/.test(value) && value.length > 20;
    
    if (isEncrypted) {
      try {
        const decrypted = decryptLocation(value);
        return decrypted || value;
      } catch (error) {
        return value;
      }
    } else {
      // If it doesn't look encrypted, return as plain text
      return value;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.status}>Warm</Text>
      </View>
      <Section title="Basic Details">
        <Field label="Client ID" value={val(client.id)} />
        <Field label="Source (D/H/C/O)" value={val(client.source_of_lead)} />
        <Field label="Location" value={safeDecrypt(client.location)} />
        <Field label="City" value={safeDecrypt(client.city)} />
        <Field label="State" value={safeDecrypt(client.state)} />
        <Field
          label="Date of Visited"
          value={formatDate(client.date_of_visit)}
        />
      </Section>
      <Section title="Client and Firm Details">
        <Field label="Name of Client" value={safeDecrypt(client.client_name)} />
        <Field label="Firm Name" value={safeDecrypt(client.firm_name)} />
        <Field label="Contact Number" value={safeDecrypt(client.contact_number)} />
        <Field label="Type of Firm" value={val(client.firm_type)} />
        <Field label="Business Vintage" value={val(client.business_vintage)} />
        <Field label="Sector" value={val(client.sector)} />
        <Field label="Bank Name" value={safeDecrypt(client.bank_name)} />
        <Field label="CIBIL Score" value={val(client.cibil_score)} />
        <Field label="Facility Type" value={val(client.facility_type)} />
        <Field
          label="Existing Funding Sanctioned Amt"
          value={formatFinancialData(client.existing_funding_sanctioned_amount)}
        />
        <Field
          label="Estimated Funding Required"
          value={formatFinancialData(client.estimated_funding_required)}
        />
        <Field
          label="Credit Period Offer"
          value={val(client.credit_period_offer) ? `${client.credit_period_offer} days` : 'N/A'}
        />
      </Section>
      <Section title="Vendor Details">
        <Field label="Product Category" value={val(vendor.product_category)} />
        <Field label="Product" value={val(vendor.product_type)} />
        <Field label="Vendor Name" value={safeDecrypt(vendor.vendor_name)} />
        <Field label="Vendor Address" value={safeDecrypt(vendor.vendor_address)} />
        <Field label="Vendor City" value={safeDecrypt(vendor.vendor_city)} />
        <Field label="Vendor State" value={safeDecrypt(vendor.vendor_state)} />
        <Field label="Vendor Pin Code" value={safeDecrypt(vendor.vendor_pin_code)} />
        <Field
          label="Vendor Contact Number"
          value={val(vendor.vendor_contact_number)}
        />
        <Field
          label="Vendor Contact Email"
          value={val(vendor.vendor_contact_email)}
        />
        <Field
          label="Monthly Sales Value"
          value={formatFinancialData(vendor.monthly_sales_value)}
        />
      </Section>
      <Section title="Visit Details">
        <Field label="Intent" value={val(client.intent)} />
        <Field label="Visit Remarks" value={val(client.client_response)} />
        <Field
          label="Date of Next Visit"
          value={formatDate(client.date_of_next_visit)}
        />
        <Field
          label="Reason for Not Interested"
          value={val(client.reason_for_not_interested)}
        />
        <Field
          label="Are you interested for?"
          value={val(client.are_you_interested_for)}
        />
      </Section>
      <TouchableOpacity style={styles.readMoreButton} onPress={onPressReadLess}>
        <Text style={styles.readMoreText}>Read Less</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const Section = ({title, children}: SectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Field = ({label, value = 'Value'}: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    backgroundColor: Colors.Yellow,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginBottom: 16,
  },
  status: {
    color: '#000',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.primaryColor,
    marginBottom: 10,
  },
  field: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontWeight: fontWeight.SemiBold,
    width: 180,
  },
  value: {
    flex: 1,
    color: Colors.graybase,
  },
  readMoreButton: {
    position: 'absolute',
    bottom: 15,
    right: 10,
  },
  readMoreText: {
    color: Colors.tertiaryBlue,
    textDecorationLine: 'underline',
    fontWeight: fontWeight.SemiBold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: scaleFont(16),
    color: Colors.graybase,
  },
});
