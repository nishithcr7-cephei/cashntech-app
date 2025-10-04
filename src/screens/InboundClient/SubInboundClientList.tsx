import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Container, AppBar} from '@components/index';
import {Colors, FontWeight} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {decryptConditionally} from '@utils/crypto';
import {InboundApplicant} from '@components/InboundClientCard';
import {LeftChevronCircle} from '@assets/Icons';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, ClientNavigatorType} from '@type/NavigatorTypes';

type NavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<ClientNavigatorType>
>;

interface SubInboundClientListProps {
  route: {
    params: {
      registrationId: string;
      clientName: string;
      applicants: InboundApplicant[];
      registrationStatus: string | null;
      sector: string;
    };
  };
}

const SubInboundClientCard: React.FC<{
  applicant: InboundApplicant;
  index: number;
  registrationStatus: string | null;
}> = ({applicant, index, registrationStatus}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        <Text style={styles.bold}>Sr.No:</Text> {index + 1}
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Application ID:</Text> {applicant.application_id}
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>CFA Supply:</Text> {decryptConditionally(applicant.applied_for || '') || 'N/A'}
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Application Status:</Text> {decryptConditionally(applicant.application_status || '') || 'N/A'}
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Registration Status:</Text> {decryptConditionally(registrationStatus || '') || 'N/A'}
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Overall Status:</Text> {decryptConditionally(applicant.overall_status || '') || 'N/A'}
      </Text>
    </View>
  );
};

export const SubInboundClientList: React.FC<SubInboundClientListProps> = ({
  route,
}) => {
  const navigation = useNavigation<NavigationType>();
  const {registrationId, clientName, applicants, registrationStatus, sector} = route.params;

  const renderItem = ({item, index}: {item: InboundApplicant; index: number}) => (
    <SubInboundClientCard applicant={item} index={index} registrationStatus={registrationStatus} />
  );

  return (
    <Container>
      <AppBar 
        title="Sub Inbound Clients" 
        navigation={navigation as any} 
        hideHamburger={true}
      />
      
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={() => {
            navigation.goBack();
          }}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>{decryptConditionally(clientName || '') || 'N/A'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sub Inbound Clients</Text>
        <Text style={styles.clientInfo}>
          <Text style={styles.bold}>Registration ID:</Text> {registrationId}
        </Text>
        <Text style={styles.clientInfo}>
          <Text style={styles.bold}>Client Name:</Text> {decryptConditionally(clientName || '') || 'N/A'}
        </Text>
        <Text style={styles.clientInfo}>
          <Text style={styles.bold}>Sector:</Text> {decryptConditionally(sector || '') || 'N/A'}
        </Text>
        <Text style={styles.countText}>
          Total Applications: {applicants.length}
        </Text>
      </View>

      <FlatList
        data={applicants}
        keyExtractor={(item, index) => `${item.application_id}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No applications found</Text>
        }
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LimeGray,
    paddingLeft: 16,
    paddingVertical: 12,
  },
  subheader: {
    marginLeft: 12,
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
    marginBottom: 8,
  },
  clientInfo: {
    fontSize: scaleFont(14),
    color: '#666666',
    marginBottom: 4,
    lineHeight: scaleFont(20),
  },
  countText: {
    fontSize: scaleFont(14),
    fontWeight: FontWeight.SemiBold,
    color: Colors.primaryColor,
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: scaleHeight(56),
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    color: '#666666',
    marginBottom: 6,
  },
  bold: {
    fontWeight: FontWeight.SemiBold,
    color: '#333333',
  },
  emptyText: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.SteelGray,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default SubInboundClientList;
