import React, { useState, useEffect } from 'react';
import { AppState, View, StyleSheet, Image } from 'react-native';
import { Appbar, Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { useBalance } from '../context/BalanceContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const NETWORK_SERVICE_URL = 'https://nextcloud.inethicloud.net/'; // Replace with your network service URL

const AppBarComponent = ({ logout }) => {
  const { balance } = useBalance();
  const [visible, setVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const checkConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const response = await fetch(NETWORK_SERVICE_URL);
        if (response.ok) {
          setVisible(false);
          await AsyncStorage.removeItem('hasShownNetworkDialog'); // Clear dialog state
        } else {
          showDialogIfNotShown();
        }
      } else {
        showDialogIfNotShown();
      }
    } catch (error) {
      showDialogIfNotShown();
    }
  };

  const showDialogIfNotShown = async () => {
    const hasShown = await AsyncStorage.getItem('hasShownNetworkDialog');
    if (!hasShown) {
      setVisible(true);
      await AsyncStorage.setItem('hasShownNetworkDialog', 'true');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000); // Check every 60 seconds

    const handleAppStateChange = async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        await AsyncStorage.removeItem('hasShownNetworkDialog');
        checkConnection(); // Check connection when app comes back to foreground
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [appState]);

  const hideDialog = async () => {
    setVisible(false);
    await AsyncStorage.setItem('hasShownNetworkDialog', 'true');
  };

  const handleInfoPress = () => {
    setInfoVisible(true);
  };

  const hideInfoDialog = () => {
    setInfoVisible(false);
  };

  return (
    <>
      <Appbar.Header style={styles.appBar}>
        <View style={styles.content}>
          <Image
            source={require('../assets/images/inethitransparent.png')} // Update this path as necessary
            style={styles.logo}
          />
          <View style={styles.iconContainer}>
            <Appbar.Action icon="logout" onPress={logout} color="#FFFFFF" />
            <MaterialCommunityIcons 
              name="information-outline" 
              size={28} 
              color="#FFFFFF" 
              onPress={handleInfoPress} 
            />
          </View>
        </View>
      </Appbar.Header>
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Internet Connection</Dialog.Title>
          <Dialog.Content>
            <Paragraph>You are not connected to iNethi Network. Some features may not be available.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>OK</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={infoVisible} onDismiss={hideInfoDialog}>
          <Dialog.Title>Information</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Here you can add some information for the users, like how to use the app or other important details.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideInfoDialog}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: '#4285F4',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 120, // Adjust the width as necessary
    height: 60, // Adjust the height as necessary
    resizeMode: 'contain',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AppBarComponent;
