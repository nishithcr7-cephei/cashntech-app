import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {RightChevron} from '@assets/Icons';
import {AppBar, Container} from '@components/index';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';
import {scaleFont} from '@utils/Scale';

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

type ItemProps = {
  title: 'Personal KYC Validation' | 'Business KYC Validation' | 'Reports';
};

const Data: ItemProps[] = [
  {title: 'Personal KYC Validation'},
  {title: 'Business KYC Validation'},
  {title: 'Reports'},
];

export const DocValidSelection = () => {
  const navigation = useNavigation<DocNavigationType>();

  const handleNavigation = (title: ItemProps['title']) => {
    if (title === 'Personal KYC Validation') {
      navigation.navigate('PersonalKYCValidation');
    } else if (title === 'Business KYC Validation') {
      navigation.navigate('BusinessKYCValidation');
    } else if (title === 'Reports') {
      // Reports navigation is not set up yet
    }
  };

  return (
    <Container>
      <AppBar title="Document Validation" navigation={navigation} />

      <View style={styles.container}>
        {Data.map(item => (
          <TouchableOpacity
            key={item.title}
            style={styles.item}
            onPress={() => handleNavigation(item.title)}>
            <Text style={styles.text}>{item.title}</Text>
            <RightChevron height={17} width={20} />
          </TouchableOpacity>
        ))}
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
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 16,
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBCED5',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray500,
  },
});
