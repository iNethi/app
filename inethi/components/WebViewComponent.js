import React from 'react';
import { WebView } from 'react-native-webview';
import { useLocation, useNavigate } from 'react-router-native';
import { Button } from 'react-native-paper'; // Assuming you're using react-native-paper

const WebViewComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { url } = location.state || {};

  return (
    <>
      <Button
        icon="arrow-left" 
        onPress={() => navigate(-1)} 
        style={{ margin: 10 }}
      >
        Go Back
      </Button>
      <WebView source={{ uri: url }} />
    </>
  );
};



export default WebViewComponent;
