/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Container, AppBar, LeadCard} from '@components/index';
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont} from '@utils/Scale';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {FontWeight} from '@constants/index';
import {LeftChevronCircle} from '@assets/Icons';
import {SoftRulestCard} from '@components/SoftRulesetCard/SoftRulestCard';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import clientSelector from '@store/client/client.selector';
import {clientActions} from '@store/client';
import softSelector from '@store/softsan/soft.selector';
import {getSoftSanctionRuleset} from '@store/softsan/soft.slice';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type Ruleset = {
  bankName: string;
  productName: string;
  methodName: string;
  rulesetId: string;
  ruleName: string;
  rulestCondition: string;
};

export const SoftSanctionRuleset = () => {
  const navigation = useNavigation<SoftInfoNavigationType>();
  const route = useRoute();
  const dispatch = useDispatch();
  const [search, setSearch] = useState<string>('');
  const rulesetRaw = useSelector(softSelector.getSoftSanctionRuleset);
  const rulesetData = Array.isArray(rulesetRaw)
    ? rulesetRaw
    : ((rulesetRaw as any)?.data ?? []);
  const rulesetLoading = useSelector(
    softSelector.getSoftSanctionRulesetLoading,
  );
  const rulesetError = useSelector(softSelector.getSoftSanctionRulesetError);
  const [refreshing, setRefreshing] = useState(false);

  // Get configRules from route params if available
  // @ts-ignore
  const {configRules, clientName, clientId} = route.params || {};


  // Trigger API call when landing on the page
  useEffect(() => {
    // @ts-ignore
    const {bankName, product, method} = route.params || {};
    
    if (bankName && product && !configRules) {
      // Trigger API call immediately
      dispatch(getSoftSanctionRuleset({bank: bankName, product, method}));
    }
  }, [route.params, configRules]);

  // Transform configRules to match SoftRulestCard format
  const transformedConfigRules = configRules
    ? configRules.map((rule: any) => ({
        bankName: rule.bank_name || 'NA',
        productName: rule.product_name || 'NA',
        methodName: rule.method_name || 'NA',
        rulesetId: rule.soft_sanction_ruleset_id || 'NA',
        ruleName: 'NA',
        rulestCondition: 'NA',
      }))
    : [];

  // Temporarily disable search filtering to test
  const filteredRulesets = configRules
    ? transformedConfigRules
    : (rulesetData && Array.isArray(rulesetData) ? rulesetData : []);




  const handleRefresh = () => {
    // @ts-ignore
    const {bankName, product, method} = route.params || {};
    
    
    setRefreshing(true);
    if (bankName && product) {
      dispatch(getSoftSanctionRuleset({bank: bankName, product, method}));
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Container>
      <AppBar title="Soft Sanction" navigation={navigation} />

      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Soft Sanction Ruleset</Text>
      </View>

      <View>
        <TouchableOpacity style={styles.Content} onPress={navigation.goBack}>
          <LeftChevronCircle height={20} width={20} />
          <Text style={styles.contentText}>
            {configRules
              ? `Rulesets for ${clientName} (${clientId})`
              : 'Rulesets'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredRulesets.length}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {rulesetLoading ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : rulesetError ? (
          <Text style={{color: 'red'}}>{String(rulesetError)}</Text>
        ) : configRules ? (
          <FlatList
            data={filteredRulesets}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({item}) => <SoftRulestCard Ruleset={item} />}
            contentContainerStyle={{paddingBottom: 20}}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ) : (
          <FlatList
            data={filteredRulesets}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({item}) => (
              <View style={styles.fallbackItem}>
                <Text style={styles.fallbackItemHeader}>
                  Bank Name:{' '}
                  <Text style={styles.fallbackItemHeaderValue}>
                    {item.bank_name}
                  </Text>
                </Text>
                <Text style={styles.fallbackItemHeader}>
                  Product Name:{' '}
                  <Text style={styles.fallbackItemHeaderValue}>
                    {item.product_name}
                  </Text>
                </Text>
                <Text style={styles.fallbackItemHeader}>
                  Method Name:{' '}
                  <Text style={styles.fallbackItemHeaderValue}>
                    {item.method_name}
                  </Text>
                </Text>
                <Text style={styles.fallbackItemHeader}>Rules:</Text>
                {item.rules && item.rules.length > 0 ? (
                  <FlatList
                    data={item.rules}
                    keyExtractor={(_, idx) => idx.toString()}
                    renderItem={({item: rule}) => (
                      <View style={styles.fallbackItemRule}>
                        <Text style={styles.fallbackItemRuleLabel}>
                          {rule.label}
                        </Text>
                        {rule.value !== null && (
                          <Text style={styles.fallbackItemRuleValue}>
                            Value: {rule.value}
                          </Text>
                        )}
                      </View>
                    )}
                  />
                ) : (
                  <Text style={styles.fallbackItemNoRules}>
                    No rules found.
                  </Text>
                )}
              </View>
            )}
            contentContainerStyle={{paddingBottom: 20}}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#fdeef1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countText: {
    color: '#d6336c',
    fontWeight: 'bold',
  },
  fallbackItem: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    elevation: 0,
  },
  fallbackItemHeader: {
    fontWeight: 'bold',
  },
  fallbackItemHeaderValue: {
    fontWeight: 'normal',
  },
  fallbackItemRule: {
    marginLeft: 8,
    marginBottom: 4,
  },
  fallbackItemRuleLabel: {
    fontWeight: '600',
  },
  fallbackItemRuleValue: {
    color: '#555',
  },
  fallbackItemNoRules: {
    marginLeft: 8,
  },
});
