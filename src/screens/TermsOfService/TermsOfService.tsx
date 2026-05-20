import React from 'react';
import {Container} from '@components/index';
import {RouteProp, useRoute} from '@react-navigation/native';
import WebView from 'react-native-webview';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {LEGAL_URLS} from '@constants/LegalUrls';

type TermsOfServiceRouteProp = RouteProp<AuthNavigatorType, 'TermsOfService'>;

export const TermsOfService = () => {
  const route = useRoute<TermsOfServiceRouteProp>();
  const uri = route.params?.uri ?? LEGAL_URLS.termsOfService;

  return (
    <Container>
      <WebView source={{uri}} />
    </Container>
  );
};
