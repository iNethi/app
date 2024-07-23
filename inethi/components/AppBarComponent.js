import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { Appbar, Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useBalance } from '../context/BalanceContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NETWORK_SERVICE_URL = 'https://nextcloud.inethicloud.net/'; // Replace with your network service URL

const AppBarComponent = ({ logout }) => {
  const { balance } = useBalance();
  const [isConnected, setIsConnected] = useState(true);
  const [visible, setVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        const response = await fetch(NETWORK_SERVICE_URL);
        if (response.ok) {
          setIsConnected(true);
          setVisible(false);
        } else {
          setIsConnected(false);
          const hasShown = await AsyncStorage.getItem('hasShownNetworkDialog');
          if (!hasShown) {
            setVisible(true);
            await AsyncStorage.setItem('hasShownNetworkDialog', 'true');
          }
        }
      } catch (error) {
        setIsConnected(false);
        const hasShown = await AsyncStorage.getItem('hasShownNetworkDialog');
        if (!hasShown) {
          setVisible(true);
          await AsyncStorage.setItem('hasShownNetworkDialog', 'true');
        }
      }
    } else {
      setIsConnected(false);
      const hasShown = await AsyncStorage.getItem('hasShownNetworkDialog');
      if (!hasShown) {
        setVisible(true);
        await AsyncStorage.setItem('hasShownNetworkDialog', 'true');
      }
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000); // Check every 60 seconds

    const handleAppStateChange = async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        const hasShown = await AsyncStorage.getItem('hasShownNetworkDialog');
        if (hasShown) {
          await AsyncStorage.removeItem('hasShownNetworkDialog');
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const unsubscribe = NetInfo.addEventListener(checkConnection);

    return () => {
      clearInterval(interval);
      unsubscribe();
      subscription.remove();
    };
  }, [appState]);

  const hideDialog = async () => {
    setVisible(false);
    await AsyncStorage.setItem('hasShownNetworkDialog', 'true');
  };

  return (
    <>
      <Appbar.Header style={styles.appBar}>
        <View style={styles.content}>
          <View>
            <Text style={styles.text}>{balance}</Text>
          </View>
          <View>
            <Text style={styles.text}>Status: {isConnected ? 'Online' : 'Offline'}</Text>
          </View>
          <View>
            <Text style={styles.text}>Data: 1GB</Text>
            <Text style={styles.text}>Time: 12:00</Text>
          </View>
          <Appbar.Action icon="logout" onPress={logout} color="#FFFFFF" />
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
  text: {
    color: '#FFFFFF',
  },
});

export default AppBarComponent;
