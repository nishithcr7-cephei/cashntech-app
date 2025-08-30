import React from 'react';
import {Container} from '@components/index';
import WebView from 'react-native-webview';

export const TermsOfService = () => {
  return (
    <Container>
      {/* <AppBar /> */}
      <WebView
        source={{
          uri: 'https://generator.lorem-ipsum.info/terms-and-conditions',
        }}
      />
    </Container>
  );
};
