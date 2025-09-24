import {RightCheckmark} from '@assets/Icons';
import {
  AppBar,
  Container,
  CustomDropdown,
  DashedButton,
  Input,
  UploadModal,
} from '@components/index';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import fontWeight from '@constants/FontWeight';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const GodownDetails2 = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  return (
    <Container>
      {uploading && (
        <View style={styles.centeredLoader} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
      <AppBar title="KYC Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Upload Godown Details</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Go Down Details</Text>

          <CustomDropdown
            label="Ownership Status"
            data={[
              {label: 'Rented', value: 'rented'},
              {label: 'Partnership', value: 'partnership'},
              {label: 'Owned', value: 'owned'},
              {label: 'Private Limited Company', value: 'private_ltd'},
              {label: 'Public Limited Company', value: 'public_ltd'},
              {label: 'Limited Liability Company', value: 'llc'},
              {label: 'Corporation', value: 'corporation'},
              {label: 'Cooperative', value: 'cooperative'},
              {label: 'Nonprofit Organization', value: 'nonprofit'},
              {label: 'Franchise', value: 'franchise'},
            ]}
            containerStyle={{marginBottom: scaleHeight(20)}}
          />
          <Input
            label="Name of Owner"
            containerStyle={{marginBottom: scaleHeight(14)}}
          />
          <DashedButton
            label="Upload Electricity Bill"
            onPress={() => setIsVisible(true)}
          />
          <UploadModal
            visible={isVisible}
            onClose={file => {
              if (file) {
                setUploading(true);
                setTimeout(() => {
                  setUploading(false);
                  setIsVisible(false);
                }, 1200);
              } else {
                setIsVisible(false);
              }
            }}
          />

          <View style={styles.footerButton}>
            <TouchableOpacity style={styles.clearButton}>
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
              <TouchableOpacity style={styles.saveButton} activeOpacity={0.7}>
                <Text style={styles.saveText}>Submit</Text>
                <RightCheckmark width={12} height={12} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: scaleWidth(24),
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
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
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginVertical: 10,
    marginBottom: scaleHeight(14),
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
  centeredLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});