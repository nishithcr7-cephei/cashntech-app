import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import React from 'react';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {UserImg} from '@assets/Images';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ClientMaster,
  LeftChevron,
  UpChevron,
  Logout,
} from '@assets/Icons';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {Colors, Fonts} from '@constants/index';
import {useDispatch, useSelector} from 'react-redux';
import {Alert} from 'react-native';
import {userSelector} from '@store/user';
import {logoutUser} from '@services/api/api';
import Toast from 'react-native-toast-message';

export const DrawerContent = ({navigation}: DrawerContentComponentProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const {top, bottom} = useSafeAreaInsets();
  const userInfo = useSelector(userSelector.getUserInfo);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: () => {
          logoutUser();
        },
      },
    ]);
  };

  return (
    <View style={styles.rootView}>
      <View style={[styles.container, {marginTop: top, marginBottom: bottom}]}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.rowCenter}>
            <Image source={UserImg} style={styles.image} resizeMode="contain" />
            <View style={styles.infoContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {userInfo.first_name + ' ' + userInfo.last_name}
              </Text>
              <Text style={styles.subTitle} numberOfLines={2}>
                {userInfo.email}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.closeDrawer()}>
            <LeftChevron height={scaleHeight(10)} width={scaleWidth(10)} />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setIsOpen(!isOpen);
                }}>
                <View style={styles.rowCenter}>
                  <ClientMaster
                    height={scaleHeight(24)}
                    width={scaleWidth(24)}
                  />
                  <Text style={styles.buttonText}>
                    Client Information Master
                  </Text>
                </View>
                <UpChevron rotation={isOpen ? 0 : 180} />
              </TouchableOpacity>
              {isOpen && (
                <View style={{marginLeft: scaleWidth(24)}}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      navigation.navigate('ClientNavigator', {
                        screen: 'ClientInfo',
                      })
                    }>
                    <Text style={styles.buttonText}>Client Information</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      navigation.navigate('ManageTask', {} as any)
                    }>
                    <Text style={styles.buttonText}>Manage Task</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      navigation.navigate('ClientNavigator', {
                        screen: 'VisitDetail',
                      })
                    }>
                    <Text style={styles.buttonText}>Visit Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      navigation.navigate('SoftNavigator', {
                        screen: 'Softsanction',
                      })
                    }>
                    <Text style={styles.buttonText}>Soft Sanction</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      navigation.navigate('KycNavigator', {
                        screen: 'KycDocument',
                      })
                    }>
                    <Text style={styles.buttonText}>KYC Document</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      Toast.show({
                        type: 'info',
                        text1: 'Document Validation',
                        text2: 'This Feature under Development',
                        visibilityTime: 3000,
                      });
                    }}>
                    <Text style={styles.buttonText}>Document Validation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      navigation.navigate('LeadNavigator', {
                        screen: 'LeadProgress',
                      })
                    }>
                    <Text style={styles.buttonText}>Lead Progress</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>


          </ScrollView>
        </View>
        {/* Logout Button*/}
        <TouchableOpacity onPress={handleLogout}>
          <View style={styles.logOut}>
            <View style={styles.row}>
              <Logout height={scaleHeight(24)} width={scaleWidth(24)} />
              <Text style={styles.buttonText}>Log Out</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootView: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0,
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('screen').height,
  },
  container: {
    flex: 1,
  },
  row: {flexDirection: 'row', alignItems: 'center'},
  rowCenter: {flexDirection: 'row', flex: 1, alignItems: 'center'},
  headerContainer: {
    padding: scaleWidth(16),
    paddingBottom: scaleHeight(26),
    backgroundColor: '#FFE9E9',
    borderTopRightRadius: scaleWidth(8),
    borderBottomWidth: scaleWidth(2),
    borderColor: 'rgba(227, 6, 19, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    backgroundColor: 'rgba(236, 74, 83, 0.3)',
    borderRadius: scaleWidth(24),
    height: scaleWidth(24),
    width: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: scaleHeight(46),
    width: scaleWidth(46),
    borderRadius: scaleWidth(23),
  },
  infoContainer: {
    marginStart: scaleWidth(16),
    flex: 1,
    marginEnd: scaleWidth(8),
  },
  title: {
    fontSize: scaleFont(18),
    fontFamily: 'Gilroy-SemiBold',
    color: Colors.primaryColor,
  },
  subTitle: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#95969C',
  },
  buttonContainer: {
    flex: 1,
    marginTop: scaleHeight(24),
    marginHorizontal: scaleWidth(16),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(8),
    marginBottom: scaleHeight(12),
    borderRadius: scaleWidth(4),
  },
  buttonText: {
    color: '#252C32',
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(16),
    marginStart: scaleWidth(16),
  },
  logOut: {
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(16),
  },
});
