import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

import {AppBar, Container, CustomDropdown} from '@components/index';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight} from '@utils/Scale';

export const KycOwner = () => {
  return (
    <Container>
      <AppBar title="KYC Document" />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>KYC Document</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Residence Details</Text>

          <CustomDropdown
            label="Ownership Status"
            data={[
              {label: 'Rented', value: 'Rented'},
              {label: 'Owned', value: 'Owned'},
            ]}
            containerStyle={{marginBottom: scaleHeight(20)}}
          />
        </View>
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
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginVertical: 10,
    marginBottom: scaleHeight(16),
  },
});