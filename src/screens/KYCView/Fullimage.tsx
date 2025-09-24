import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {LeftChevron} from '@assets/Icons';
import Colors from '@constants/Colors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';

interface FullImageProps {
  route: {
    params: {
      imageUrl: string;
    };
  };
  navigation: any;
}

export const FullImage: React.FC<FullImageProps> = ({route, navigation}) => {
  const {imageUrl} = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <LeftChevron width={24} height={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Full image display */}
      <View style={styles.imageContainer}>
        <Image
          source={{uri: imageUrl}}
          style={styles.fullImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    paddingTop: scaleHeight(50), // Add extra padding for status bar
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: scaleWidth(12),
    borderRadius: scaleWidth(25),
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(16),
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
