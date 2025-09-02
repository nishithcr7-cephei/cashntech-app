import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import {
  AppBar,
  Container,
  CustomDropdown,
  FooterButton,
  Input,
} from '@components/index';
import {LeftChevronCircle} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, ClientsDetailsType, clientSelector} from '@store/client';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType} from '@type/NavigatorTypes';
import Toast from 'react-native-toast-message';
import { ClientScreens } from '@constants/Screens';

export enum ClientType {
  OWNER = 'Owner',
  DIRECTOR = 'Director',
  DESIGNATED_PARTNER = 'Designated Partner',
}

const listOfTypes = Object.values(ClientType).map(item => ({
  label: item,
  value: item,
}));

type Props = NativeStackScreenProps<ClientNavigatorType, 'ClientDetailForm'>;

export const ClientDetailForm = ({navigation}: Props) => {
  const dispatch = useDispatch();

  const clientFormId = useSelector(clientSelector.getClientFormId);
  const clientLoader = useSelector(clientSelector.getClientLoader);
  const clientDetails = useSelector(clientSelector.getClientDetailsFormData);
  const isSavedClientsDetails = useSelector(clientSelector.getClientsDetailsFormStatus);

  function setData<T>(
    field: keyof ClientsDetailsType[number],
    value: T,
    index: number,
  ) {
    dispatch(clientActions.setClientsDetails([{[field]: value}, index]));
  }

  const handleAddClient = () => {
    dispatch(clientActions.addNewClientDetails());
  };

  const handleClear = () => {
    dispatch(clientActions.clearClientDetails());
  };

  const handleSave = () => {
    if (isSavedClientsDetails) {
      dispatch(clientActions.saveClientsDetails());
    }else {
      dispatch(clientActions.updateClientsDetails());
    }
  };

  const handleNext = () => {
    if(isSavedClientsDetails){
      navigation.navigate(ClientScreens.FirmDetailForm);
    }else{
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please save the client details before proceeding.',
      });
    }
  };

  const removeClient = (id: string) => {
    dispatch(clientActions.removeClientDetails(id));
  };

  return (
    <Container>
      <AppBar title="Client Information Master" />
      <View>
        <TouchableOpacity
          style={styles.subContainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.subheader}>Client Details</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingScrollView style={{flexGrow: 1}}>
        <Input
          label="Client ID"
          value={clientFormId?.toString()}
          editable={false}
          containerStyle={{marginHorizontal: scaleWidth(24)}}
        />
        {clientDetails.map((client, index) => (
          <View key={client.key} style={{marginBottom: 20}}>
            <View style={styles.inputContainer}>
              <View style={styles.clientHeader}>
                <Text style={styles.formTitle}>Client {index + 1}</Text>
                {index != 0 && (
                  <TouchableOpacity
                    style={styles.trashButton}
                    onPress={() => removeClient(client.key)}>
                    <FontAwesome6
                      name="trash"
                      iconStyle="solid"
                      size={14}
                      color={'rgb(112,112,112)'}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <Input
                label="Name of Client"
                placeholder="Name of Client"
                value={client.nameOfClient}
                onChangeText={value => setData('nameOfClient', value, index)}
              />
              <CustomDropdown
                label="Type"
                data={listOfTypes}
                value={client.clientType}
                onChange={value => setData('clientType', value, index)}
              />
              <Input
                label="Contact Number"
                placeholder="Value"
                value={client.contactNumber}
                keyboardType="phone-pad"
                onChangeText={value => setData('contactNumber', value, index)}
              />
              <Input
                label="Email"
                placeholder="Value"
                value={client.email}
                keyboardType="email-address"
                onChangeText={value => setData('email', value, index)}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
          <Text style={styles.addButtonText}>Add Client +</Text>
        </TouchableOpacity>
      </KeyboardAvoidingScrollView>
      <FooterButton
        onPressClearAll={handleClear}
        onPressSave={handleSave}
        onPressNext={handleNext}
      />
      <Modal transparent visible={clientLoader}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
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
    color: Colors.darkblack,
  },
  inputContainer: {
    marginHorizontal: scaleWidth(24),
    marginTop: scaleHeight(17),
    gap: scaleHeight(20),
  },
  formTitle: {
    fontSize: scaleFont(18),
    fontWeight: fontWeight.Medium,
    color: Colors.darkblack,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2.5,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(8),
    marginHorizontal: scaleHeight(24),
    paddingVertical: scaleHeight(8),
    alignSelf: 'flex-start',
    marginTop: scaleHeight(17),
    minWidth: scaleWidth(110),
  },
  addButtonText: {
    fontSize: scaleFont(14),
    color: '#7A7A7A',
    fontWeight: fontWeight.Medium,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  trashButton: {
    padding: scaleWidth(6),
    borderRadius: scaleWidth(24),
    borderColor: 'rgb(112,112,112)',
    borderWidth: 1,
    height: scaleWidth(32),
    width: scaleWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
