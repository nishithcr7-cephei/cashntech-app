/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {AppBar, Container, RulesetTCPDCard} from '@components/index';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {LeftChevronCircle} from '@assets/Icons';
import FontWeight from '@constants/FontWeight';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {RulesetViewCard} from '@components/RulesetTCPDCard/RulesetViewCard';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type RulesetViewArr = {
  basis: string;
  creditPeriod: string;
  methodName: string;
  tpaAmount: string;
  finallimit: string;
};

export const RulesetView = () => {
  const navigation = useNavigation<SoftInfoNavigationType>();
  const route = useRoute();
  const {rulesetData, location, clientName, clientId, errorMessage} = (route.params ||
    {}) as {
    rulesetData?: any[];
    location?: string;
    clientName?: string;
    clientId?: string;
    errorMessage?: string;
  };
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const staticLeads: RulesetViewArr[] = [
    {
      basis: 'Sales',
      creditPeriod: '30',
      methodName: 'Turnover Method',
      tpaAmount: '20,00,000',
      finallimit: '50,00,000',
    },
    {
      basis: 'Brand Purchase',
      creditPeriod: '20',
      methodName: 'Purchase Method',
      tpaAmount: '30,00,000',
      finallimit: '60,00,000',
    },
    {
      basis: 'Stock and Debitor',
      creditPeriod: '50',
      methodName: 'WC Method',
      tpaAmount: '90,00,000',
      finallimit: '100,00,000',
    },
  ];

  // If rulesetData is provided, use the raw objects after the first meta object for dynamic rendering
  const leads = Array.isArray(rulesetData)
    ? rulesetData.slice(1)
    : staticLeads;

  const filteredLeads = Array.isArray(leads)
    ? (leads as any[]).filter(lead => {
        const basisVal = (lead as any)?.basis;
        if (typeof basisVal === 'string') {
          return basisVal.toLowerCase().includes(search.toLowerCase());
        }
        return true;
      })
    : [];

  const numericFinalLimits = Array.isArray(filteredLeads)
    ? filteredLeads
        .map(lead => {
          const raw = (lead as any)?.final_limit ?? (lead as any)?.finallimit;
          const num = Number(String(raw ?? '').toString().replace(/,/g, ''));
          return isNaN(num) ? undefined : num;
        })
        .filter((n): n is number => typeof n === 'number')
    : [];
  const hasAnyFinalLimit = numericFinalLimits.length > 0;
  const minFinalLimit = hasAnyFinalLimit
    ? Math.min(...numericFinalLimits)
    : undefined;

  const formattedMinFinalLimit = hasAnyFinalLimit
    ? (minFinalLimit as number).toLocaleString('en-IN')
    : '-';

  const ListFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>
        Final Eligibility :{' '}
        <Text style={styles.footerAmount}>{formattedMinFinalLimit}</Text>
      </Text>
    </View>
  );

  // Get bank name and product from first object in rulesetData if available
  const metaInfo =
    Array.isArray(rulesetData) && rulesetData.length > 0 ? rulesetData[0] : {};
  const displayBankName = metaInfo.bank_name || 'Bank Name';
  const displayProductName = metaInfo.product || 'Product Name';
  // Method can be an array or string; normalize to a display string
  const displayMethodName = Array.isArray((metaInfo as any).method)
    ? ((metaInfo as any).method as any[]).join(', ')
    : ((metaInfo as any).method || '');

  return (
    <Container>
      <AppBar title="Soft Sanction" navigation={navigation} />

      {isLoading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      ) : errorMessage ? (
        // Display error message in center
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={navigation.goBack}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.Subcontainer}>
            <Text style={styles.Subheader}>SoftSanction View</Text>
          </View>
          <View>
            <TouchableOpacity
              style={styles.Content}
              onPress={navigation.goBack}>
              <LeftChevronCircle height={20} width={20} />
              <Text style={styles.contentText}>
                {displayBankName}
                {displayProductName ? `  Product[${displayProductName}]` : ''}
                {displayMethodName ? `  Method[${displayMethodName}]` : ''}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeading}>
            <Text style={styles.subHeadingText}>Client Name: {clientName}</Text>
            <Text style={styles.subHeadingText}>City: {location}</Text>
          </View>
          <View style={styles.container}>
            <FlatList
              data={filteredLeads}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.push('UGROTurnoverMethod', {
                      clientId: clientId || '',
                      method: (item as any)?.method || '',
                      bank: (metaInfo as any).bank_name,
                      product: (metaInfo as any).product,
                      clientName: clientName || '',
                    } as any)
                  }>
                  <RulesetViewCard data={item as any} />
                </TouchableOpacity>
              )}
              contentContainerStyle={{paddingBottom: 20}}
              ListFooterComponent={ListFooter}
            />
          </View>
        </>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  Subcontainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  Content: {
    margin: 15,
    flexDirection: 'row',
    gap: 8,
  },
  contentText: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
  },
  container: {
    padding: 16,
    flex: 1,
  },
  subHeading: {
    padding: 16,
  },
  subHeadingText: {
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
    marginBottom: scaleHeight(12),
    color: Colors.gray500,
  },
  bodyText: {
    fontSize: scaleFont(12),
    fontWeight: fontWeight.Medium,
    color: Colors.gray300,
  },
  footerContainer: {
    paddingVertical: 8,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    backgroundColor: '#c7c7c7',
    paddingLeft: 20,
    marginLeft: 8,
  },
  footerText: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.gray500,
    paddingLeft: 4,
  },
  footerAmount: {
    color: Colors.gray500,
    fontWeight: fontWeight.Bold,
    fontSize: scaleFont(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  errorTitle: {
    fontSize: scaleFont(20),
    fontWeight: fontWeight.Bold,
    color: Colors.red,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.Medium,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: Colors.primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Colors.white,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
  },
});
