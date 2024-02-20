import React, { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { useLocation, useNavigate } from 'react-router-native';
import { Button } from 'react-native-paper';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
const WebViewComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { url } = location.state || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <>
      <Button
        icon="arrow-left"
        onPress={() => navigate(-1)}
        style={{ margin: 10 }}
      >
        Go Back
      </Button>
      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error loading page</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          onError={(e) => setError(e.nativeEvent)}
          startInLoadingState={true}
          renderLoading={() => (
            <ActivityIndicator size="large" color="#0000ff" style={styles.centered} />
          )}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});



export default WebViewComponent;
