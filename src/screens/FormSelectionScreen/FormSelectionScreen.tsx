import {LeftChevronCircle, RightChevron} from '@assets/Icons';
import {AppBar, Container} from '@components/index';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont} from '@utils/Scale';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  ALL_FORMS,
  FormSelectionProps,
  ListItemProps,
} from './FormSelection.type';
import {useSelector} from 'react-redux';
import {clientSelector} from '@store/client';
import Toast from 'react-native-toast-message';
import { ClientScreens } from '@constants/Screens';

const Strings = {
  appBarTitle: 'Client Information Master',
  collectLeadInfo: 'Collect Lead Information',
  textColor: '#333',
  itemBgColor: '#fff',
  borderColor: '#CBCED5',
};

export const FormSelectionScreen: React.FC<FormSelectionProps> = ({
  navigation,
}) => {
  const currentFormId = useSelector(clientSelector.getClientFormId);
  const onPressFormItem = (item: ListItemProps) => {
    if (item.screen !== 'BasicDetails' && !currentFormId) {
      Toast.show({
        text1: 'Incomplete Form',
        text2: 'Please complete the basic details form before proceeding',
        type: 'info',
      });
      return;
    }
    if (item.screen === 'BasicDetails') {
      navigation.navigate(ClientScreens.BasicDetailForm);
    }
    if (item.screen === 'ClientDetails') {
      navigation.navigate(ClientScreens.ClientDetailForm);
    }
    if (item.screen === 'FirmDetails') {
      navigation.navigate(ClientScreens.FirmDetailForm);
    }
  };

  return (
    <Container>
      <AppBar title={Strings.appBarTitle} navigation={navigation} />
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>{Strings.collectLeadInfo}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {ALL_FORMS.map(item => (
          <TouchableOpacity
            key={item.title}
            style={styles.item}
            onPress={() => onPressFormItem(item)}>
            <Text style={styles.text}>{item.title}</Text>
            <RightChevron height={17} width={20} />
          </TouchableOpacity>
        ))}
      </View>
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
    fontWeight: fontWeight.SemiBold,
    color: Strings.textColor,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Strings.itemBgColor,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Strings.borderColor,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray500,
  },
});
