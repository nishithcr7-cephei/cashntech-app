import {RightCheckmark} from '@assets/Icons';
import {AppBar, Container, DashedButton, UploadModal} from '@components/index';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import fontWeight from '@constants/FontWeight';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {clientActions} from '@store/client';
import {
  HomeNavigatorType,
  ClientNavigatorType,
  KycNavigatorType,
} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch} from 'react-redux';

type NavigationType = CompositeNavigationProp<
  NativeStackNavigationProp<ClientNavigatorType>,
  DrawerNavigationProp<HomeNavigatorType>
>;

export const CompanyDocument = () => {
  const navigation = useNavigation<NavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'CompanyDocument'>>();
  const [uploadType, setUploadType] = useState<
    'aoaDoc' | 'moaDoc' | 'coiDoc' | 'otherDoc' | null
  >(null);
  const [aoaDocument, setAoaDocument] = useState<
    DocumentPickerResponse | undefined
  >();
  const [moaDocument, setMoaDocument] = useState<
    DocumentPickerResponse | undefined
  >();
  const [coiDocument, setCoiDocument] = useState<
    DocumentPickerResponse | undefined
  >();
  const [otherDocument, setOtherDocument] = useState<
    DocumentPickerResponse | undefined
  >();
  const [errors, setErrors] = useState({
    aoaDocument: false,
    moaDocument: false,
    coiDocument: false,
    otherDocument: false,
  });

  const dispatch = useDispatch();

  const handleSubmit = () => {
    if (!aoaDocument || !moaDocument || !coiDocument || !otherDocument) {
      setErrors({
        aoaDocument: !aoaDocument,
        moaDocument: !moaDocument,
        coiDocument: !coiDocument,
        otherDocument: !otherDocument,
      });

      let missingFields = [];
      if (!aoaDocument) missingFields.push('AOA Document');
      if (!moaDocument) missingFields.push('MOA Document');
      if (!coiDocument) missingFields.push('COI Document');
      if (!otherDocument) missingFields.push('Other Document');

      Alert.alert(
        'Missing Fields',
        `Please provide the following: \n${missingFields.join('\n')}`,
      );
      return;
    }

    setErrors({
      aoaDocument: false,
      moaDocument: false,
      coiDocument: false,
      otherDocument: false,
    });

    const payload = {
      clientId: params.clientID,
      uploaded_by: getUserFullName(),
      doc: [
        {
          uri: aoaDocument.uri,
          name: aoaDocument.name ?? Date.now().toString(),
          type: aoaDocument.type ?? 'image/png',
        },
        {
          uri: moaDocument.uri,
          name: moaDocument.name ?? Date.now().toString(),
          type: moaDocument.type ?? 'image/png',
        },
        {
          uri: coiDocument.uri,
          name: coiDocument.name ?? Date.now().toString(),
          type: coiDocument.type ?? 'image/png',
        },
        {
          uri: otherDocument.uri,
          name: otherDocument.name ?? Date.now().toString(),
          type: otherDocument.type ?? 'image/png',
        },
      ],
    };

    setLoading(true);
    dispatch(clientActions.uploadCompanyInfoRequest(payload));
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Document Uploaded',
        text2: `${aoaDocument}'s document submitted successfully`,
        position: 'top',
      });
      handleClear();
    }, 1500);
  };

  const handleClear = () => {
    setAoaDocument(undefined);
    setMoaDocument(undefined);
    setCoiDocument(undefined);
    setOtherDocument(undefined);
  };

  return (
    <Container>
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
      <AppBar title="Client Information Master" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Kyc Document</Text>
      </View>
      <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          {/* Main Applicant Section */}
          <Text style={styles.sectionTitle}>Company Documents</Text>

          <Text style={styles.subTitle}>AOA</Text>

          {aoaDocument ? (
            <Text>File Name: {aoaDocument.name}</Text>
          ) : (
            <DashedButton
              label="Upload AOA Document"
              onPress={() => {
                setUploadType('aoaDoc');
                setIsVisible(true);
              }}
              containerStyle={
                errors.aoaDocument ? {borderColor: Colors.red} : undefined
              }
            />
          )}

          <Text style={styles.subTitle}>MOA</Text>
          {moaDocument ? (
            <Text>File Name: {moaDocument.name}</Text>
          ) : (
            <DashedButton
              label="Upload MOA Document"
              onPress={() => {
                setUploadType('moaDoc');
                setIsVisible(true);
              }}
              containerStyle={
                errors.moaDocument ? {borderColor: Colors.red} : undefined
              }
            />
          )}

          <Text style={styles.subTitle}>COI</Text>
          {coiDocument ? (
            <Text>File Name: {coiDocument.name}</Text>
          ) : (
            <DashedButton
              label="Upload COI Document"
              onPress={() => {
                setUploadType('coiDoc');
                setIsVisible(true);
              }}
              containerStyle={
                errors.coiDocument ? {borderColor: Colors.red} : undefined
              }
            />
          )}

          <Text style={styles.subTitle}>Other Document</Text>
          {otherDocument ? (
            <Text>File Name: {otherDocument.name}</Text>
          ) : (
            <DashedButton
              label="Upload Other Document"
              onPress={() => {
                setUploadType('otherDoc');
                setIsVisible(true);
              }}
              containerStyle={
                errors.otherDocument ? {borderColor: Colors.red} : undefined
              }
            />
          )}

          <UploadModal
            visible={isVisible}
            onClose={file => {
              if (file) {
                switch (uploadType) {
                  case 'aoaDoc':
                    setAoaDocument(file);
                    break;
                  case 'moaDoc':
                    setMoaDocument(file);
                    break;
                  case 'coiDoc':
                    setCoiDocument(file);
                    break;
                  case 'otherDoc':
                    setOtherDocument(file);
                    break;
                }
              }
              setIsVisible(false);
              setUploadType(null);
            }}
          />

          <View style={styles.footerButton}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.saveButton, {backgroundColor: Colors.white}]}
                activeOpacity={0.7}>
                <Text style={[styles.saveText, {color: Colors.green}]}>
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.7}
                onPress={handleSubmit}>
                <Text style={styles.saveText}>Submit</Text>
                <RightCheckmark width={12} height={12} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  scrollContainer: {
    padding: scaleWidth(24),
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginVertical: 10,
    marginBottom: scaleHeight(20),
  },
  subTitle: {
    marginVertical: 10,
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    marginTop: scaleHeight(30),
  },
  clearButton: {},
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    gap: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.green,
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
});
