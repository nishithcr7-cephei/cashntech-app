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
import {kycActions} from '@store/kyc';
import {
  HomeNavigatorType,
  ClientNavigatorType,
  KycNavigatorType,
} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import {FILE_DOWNLOAD_URL} from '@config/config';
import {Linking} from 'react-native';
import React, {useState, useEffect, useMemo} from 'react';
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
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/app/store';

type NavigationType = CompositeNavigationProp<
  NativeStackNavigationProp<ClientNavigatorType, keyof ClientNavigatorType>,
  DrawerNavigationProp<HomeNavigatorType>
>;

export const CompanyDocument = () => {
  const navigation = useNavigation<NavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Existing company docs data states
  const [existingDocs, setExistingDocs] = useState<{
    aoa?: string;
    moa?: string;
    coi?: string;
    others?: string;
  }>({});
  const [documentsRemoved, setDocumentsRemoved] = useState({
    aoa: false,
    moa: false,
    coi: false,
    others: false,
  });

  const [errors, setErrors] = useState({
    aoaDocument: false,
    moaDocument: false,
    coiDocument: false,
    otherDocument: false,
  });

  const dispatch = useDispatch();
  
  // Redux state
  const {personalKycLoading, personalKycData, personalKycError} = useSelector(
    (state: RootState) => state.kyc
  );

  // Fetch existing company documents using Redux Saga
  const fetchExistingCompanyDocs = () => {
    console.log('🔍 fetchExistingCompanyDocs called with params:', params);
    if (!params?.clientID) {
      console.log('❌ No clientID found, returning early');
      return;
    }
    
    console.log('🚀 Dispatching getBusinessKycRequest with:', {
      clientId: params.clientID.toString(),
      docType: 'company_docs'
    });
    console.log('🏢🏢🏢 DISPATCHING BUSINESS KYC REQUEST FOR COMPANY DOCS 🏢🏢🏢');
    
    dispatch(kycActions.getBusinessKycRequest({
      clientId: params.clientID.toString(),
      docType: 'company_docs'
    }));
  };

  // Handle Redux state changes
  useEffect(() => {
    console.log('📊 useEffect triggered - personalKycData:', personalKycData);
    console.log('⏳ personalKycLoading:', personalKycLoading);
    console.log('❌ personalKycError:', personalKycError);
    
    if (personalKycData && personalKycData.length > 0) {
      console.log('✅ Found personalKycData, processing...');
      const companyDocsRecords = personalKycData;
      
      // Process main applicant (first record)
      if (companyDocsRecords.length > 0) {
        const mainApplicantData = companyDocsRecords[0];
        console.log('📄 mainApplicantData:', mainApplicantData);
        console.log('📁 filename_obj:', mainApplicantData.filename_obj);
        
        const companyDocs = (mainApplicantData.filename_obj as any)?.company_docs;
        
        console.log('🔍 Extracted company docs:', companyDocs);
        
        if (companyDocs) {
          console.log('✅ Found company docs, setting up existing data...');
          
          setExistingDocs({
            aoa: companyDocs.aoa,
            moa: companyDocs.moa,
            coi: companyDocs.coi,
            others: companyDocs.others,
          });
          
          // Set edit mode if any existing data is found
          console.log('🔄 Setting edit mode to true');
          setIsEditMode(true);
        } else {
          console.log('❌ No company docs found in data');
        }
      }
    } else if (personalKycData && personalKycData.length === 0) {
      console.log('📭 No data found, setting edit mode to false');
      setIsEditMode(false);
    } else {
      console.log('❓ personalKycData is null or undefined');
    }
  }, [personalKycData, params?.clientID]);

  // Handle error state
  useEffect(() => {
    if (personalKycError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch existing company documents',
        position: 'top',
      });
    }
  }, [personalKycError]);

  // Fetch existing company documents on component mount
  useEffect(() => {
    console.log('🏁 Component mount useEffect triggered, params?.clientID:', params?.clientID);
    fetchExistingCompanyDocs();
  }, [params?.clientID]);

  const openPdfInBrowser = (fileName: string) => {
    const pdfUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
    Linking.openURL(pdfUrl).catch(err => {
      console.error('Failed to open PDF:', err);
      Alert.alert('Error', 'Failed to open PDF document');
    });
  };

  const handleSubmit = () => {
    // Check if we have at least one document uploaded or existing
    const hasAoaDoc = aoaDocument || (existingDocs.aoa && !documentsRemoved.aoa);
    const hasMoaDoc = moaDocument || (existingDocs.moa && !documentsRemoved.moa);
    const hasCoiDoc = coiDocument || (existingDocs.coi && !documentsRemoved.coi);
    const hasOtherDoc = otherDocument || (existingDocs.others && !documentsRemoved.others);

    if (!hasAoaDoc || !hasMoaDoc || !hasCoiDoc || !hasOtherDoc) {
      setErrors({
        aoaDocument: !hasAoaDoc,
        moaDocument: !hasMoaDoc,
        coiDocument: !hasCoiDoc,
        otherDocument: !hasOtherDoc,
      });

      let missingFields = [];
      if (!hasAoaDoc) missingFields.push('AOA Document');
      if (!hasMoaDoc) missingFields.push('MOA Document');
      if (!hasCoiDoc) missingFields.push('COI Document');
      if (!hasOtherDoc) missingFields.push('Other Document');

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

    // Prepare documents array - only include new uploads
    const docArray = [];
    if (aoaDocument) {
      docArray.push({
        uri: aoaDocument.uri,
        name: aoaDocument.name ?? Date.now().toString(),
        type: aoaDocument.type ?? 'application/pdf',
      });
    }
    if (moaDocument) {
      docArray.push({
        uri: moaDocument.uri,
        name: moaDocument.name ?? Date.now().toString(),
        type: moaDocument.type ?? 'application/pdf',
      });
    }
    if (coiDocument) {
      docArray.push({
        uri: coiDocument.uri,
        name: coiDocument.name ?? Date.now().toString(),
        type: coiDocument.type ?? 'application/pdf',
      });
    }
    if (otherDocument) {
      docArray.push({
        uri: otherDocument.uri,
        name: otherDocument.name ?? Date.now().toString(),
        type: otherDocument.type ?? 'application/pdf',
      });
    }

    const payload = {
      clientId: Number(params.clientID),
      uploaded_by: getUserFullName(),
      doc: docArray,
    };

    setLoading(true);
    dispatch(kycActions.uploadCompanyInfoRequest(payload));
    
    // Simulate API call delay and handle success
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: isEditing ? 'Documents Updated' : 'Documents Uploaded',
        text2: `Company documents ${isEditing ? 'updated' : 'submitted'} successfully`,
        position: 'top',
      });
      
      // Refresh business KYC checked list to update tick marks
      dispatch(kycActions.getKycBusinessChecked(params.clientID.toString()));
      
      // Clear form and navigate back
      handleClear();
      navigation.goBack();
    }, 1500);
  };

  const handleClear = () => {
    setAoaDocument(undefined);
    setMoaDocument(undefined);
    setCoiDocument(undefined);
    setOtherDocument(undefined);
    setExistingDocs({});
    setDocumentsRemoved({
      aoa: false,
      moa: false,
      coi: false,
      others: false,
    });
    setIsEditMode(false);
    setIsEditing(false);
  };

  return (
    <Container>
      {(loading || uploading || personalKycLoading) && (
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

          {personalKycLoading ? (
            <View style={styles.imageContainer}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Loading existing AOA document...</Text>
            </View>
          ) : existingDocs.aoa && !documentsRemoved.aoa && !aoaDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(existingDocs.aoa!)}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{existingDocs.aoa}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setDocumentsRemoved(prev => ({...prev, aoa: true}));
                  setAoaDocument(undefined);
                  setErrors(prev => ({...prev, aoaDocument: false}));
                }}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setUploadType('aoaDoc');
                  setIsVisible(true);
                }}>
                <Text style={styles.changeImageText}>Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : aoaDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(aoaDocument.name || 'document.pdf')}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{aoaDocument.name}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setAoaDocument(undefined)}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
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
              {errors.aoaDocument && (
                <Text style={styles.errorText}>AOA Document is required</Text>
              )}
            </View>
          )}

          <Text style={styles.subTitle}>MOA</Text>
          {existingDocs.moa && !documentsRemoved.moa && !moaDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(existingDocs.moa!)}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{existingDocs.moa}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setDocumentsRemoved(prev => ({...prev, moa: true}));
                  setMoaDocument(undefined);
                  setErrors(prev => ({...prev, moaDocument: false}));
                }}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setUploadType('moaDoc');
                  setIsVisible(true);
                }}>
                <Text style={styles.changeImageText}>Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : moaDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(moaDocument.name || 'document.pdf')}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{moaDocument.name}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setMoaDocument(undefined)}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
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
              {errors.moaDocument && (
                <Text style={styles.errorText}>MOA Document is required</Text>
              )}
            </View>
          )}

          <Text style={styles.subTitle}>COI</Text>
          {existingDocs.coi && !documentsRemoved.coi && !coiDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(existingDocs.coi!)}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{existingDocs.coi}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setDocumentsRemoved(prev => ({...prev, coi: true}));
                  setCoiDocument(undefined);
                  setErrors(prev => ({...prev, coiDocument: false}));
                }}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setUploadType('coiDoc');
                  setIsVisible(true);
                }}>
                <Text style={styles.changeImageText}>Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : coiDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(coiDocument.name || 'document.pdf')}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{coiDocument.name}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setCoiDocument(undefined)}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
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
              {errors.coiDocument && (
                <Text style={styles.errorText}>COI Document is required</Text>
              )}
            </View>
          )}

          <Text style={styles.subTitle}>Other Document</Text>
          {existingDocs.others && !documentsRemoved.others && !otherDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(existingDocs.others!)}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{existingDocs.others}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setDocumentsRemoved(prev => ({...prev, others: true}));
                  setOtherDocument(undefined);
                  setErrors(prev => ({...prev, otherDocument: false}));
                }}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setUploadType('otherDoc');
                  setIsVisible(true);
                }}>
                <Text style={styles.changeImageText}>Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : otherDocument ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(otherDocument.name || 'document.pdf')}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{otherDocument.name}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setOtherDocument(undefined)}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
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
              {errors.otherDocument && (
                <Text style={styles.errorText}>Other Document is required</Text>
              )}
            </View>
          )}

          <UploadModal
            visible={isVisible}
            allowedFileTypes={['pdf']}
            onClose={file => {
              if (file) {
                setUploading(true);
                setTimeout(() => {
                  switch (uploadType) {
                    case 'aoaDoc':
                      setAoaDocument(file);
                      if (errors.aoaDocument)
                        setErrors(prev => ({...prev, aoaDocument: false}));
                      break;
                    case 'moaDoc':
                      setMoaDocument(file);
                      if (errors.moaDocument)
                        setErrors(prev => ({...prev, moaDocument: false}));
                      break;
                    case 'coiDoc':
                      setCoiDocument(file);
                      if (errors.coiDocument)
                        setErrors(prev => ({...prev, coiDocument: false}));
                      break;
                    case 'otherDoc':
                      setOtherDocument(file);
                      if (errors.otherDocument)
                        setErrors(prev => ({...prev, otherDocument: false}));
                      break;
                  }
                  setUploading(false);
                  setIsVisible(false);
                  setUploadType(null);
                }, 1200);
              } else {
                setIsVisible(false);
                setUploadType(null);
              }
            }}
          />

          <View style={styles.footerButton}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.7}
                disabled={personalKycLoading}
                onPress={() => {
                  if (isEditMode && !isEditing) {
                    setIsEditing(true);
                  } else {
                    handleSubmit();
                  }
                }}>
                <Text style={styles.saveText}>
                  {isEditMode && !isEditing ? 'Edit' : 'Save'}
                </Text>
                <RightCheckmark width={12} height={12} color={Colors.white} />
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
  errorText: {
    color: Colors.red,
    fontSize: scaleFont(12),
    marginTop: 4,
    marginBottom: scaleHeight(8),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: scaleHeight(20),
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: scaleWidth(240),
  },
  existingImageContainer: {
    borderColor: Colors.graybase,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(4),
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  tapToViewText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    marginTop: scaleHeight(8),
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeImageText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: 'bold',
  },
  changeImageButton: {
    marginTop: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(4),
    alignSelf: 'center',
  },
  changeImageText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: fontWeight.Medium,
  },
  loadingText: {
    marginTop: scaleHeight(10),
    fontSize: scaleFont(14),
    color: Colors.graybase,
  },
  pdfIconContainer: {
    width: scaleWidth(200),
    height: scaleHeight(140),
    backgroundColor: '#f5f5f5',
    borderRadius: scaleWidth(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  pdfIcon: {
    fontSize: scaleFont(48),
    marginBottom: scaleHeight(8),
  },
  pdfText: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.Medium,
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  fileNameText: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    textAlign: 'center',
    maxWidth: scaleWidth(180),
  },
});