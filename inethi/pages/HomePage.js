import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Dialog,
  Portal,
  TextInput,
  Paragraph,
  IconButton,
} from 'react-native-paper';
import {useNavigate} from 'react-router-native';
import axios from 'axios';
import {getToken} from '../utils/tokenUtils';
import {useBalance} from '../context/BalanceContext'; // Import useBalance
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import ServiceContainer from '../components/ServiceContainer';

const HomePage = ({logout}) => {
  const baseURL = 'https://manage-backend.inethicloud.net';

  const LbaseURL = 'http://172.16.13.141:9000';
  const navigate = useNavigate();
  const [isCreateWalletDialogOpen, setIsCreateWalletDialogOpen] =
    useState(false);
  const [walletName, setWalletName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {balance, fetchBalance} = useBalance();

  const [categories, setCategories] = useState({
    Wallet: [
      {
        name: 'Wallet',
        action: () => navigate('/wallet-categories'),
        url: '', // Add an empty URL field to maintain structure
      },
    ],
  });

  const timeout = ms =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    );

  const fetchServices = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const urlLocal = 'http://172.16.13.141:9000';
      const urlGlobal =
        'https://manage-backend.inethicloud.net/service/list-by-type/';

      let servicesDataGlobal = {};
      let servicesDataLocal = {};

      try {
        const responseGlobal = await Promise.race([
          axios.get(urlGlobal, config),
          timeout(5000),
        ]);
        servicesDataGlobal = responseGlobal.data.data;
      } catch (err) {
        console.error(`Error fetching global data. You may not have Internet.`);
      }

      try {
        const responseLocal = await Promise.race([
          axios.get(urlLocal, config),
          timeout(5000),
        ]);
        servicesDataLocal = responseLocal.data.data;
      } catch (err) {
        console.error(
          `Error fetching local data. Are you connected to an iNethi network?`,
        );
      }

      const combinedServices = {...servicesDataGlobal};

      Object.entries(servicesDataLocal).forEach(([category, services]) => {
        combinedServices[category] = services;
      });

      const fetchedCategories = {
        ...categories, // Include the Wallet and App categories
      };

      Object.entries(combinedServices).forEach(([category, services]) => {
        fetchedCategories[category] = services.map(service => ({
          name: service.name,
          url: service.url,
          action: () => navigate('/webview', {state: {url: service.url}}),
        }));
      });

      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(`Failed to fetch services: ${err.message}`);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchServices(), fetchBalance()]);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const openURL = url => {
    navigate('/webview', {state: {url}});
  };

  const renderButtons = buttons => {
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const pair = buttons.slice(i, i + 2);
      buttonRows.push(
        <View key={i} style={styles.buttonRow}>
          {pair.map(({name, action, url, requiresWallet, disabled}, idx) => {
            const isDisabled = (requiresWallet && !hasWallet) || disabled;
            return (
              <Button
                key={idx}
                mode="contained"
                onPress={() => {
                  if (action && !isDisabled) {
                    action();
                  } else if (url && !isDisabled) {
                    openURL(url);
                  } else {
                    console.error('Button has no action or URL');
                  }
                }}
                style={[styles.button, isDisabled && styles.buttonDisabled]}
                labelStyle={
                  isDisabled ? styles.buttonTextDisabled : styles.buttonText
                }
                disabled={isDisabled}>
                {name}
              </Button>
            );
          })}
        </View>,
      );
    }
    return buttonRows;
  };

  const renderCategoryCards = () =>
    Object.entries(categories).map(([category, buttons], index) => (
      <Card key={index} style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>{category}</Title>
          {renderButtons(buttons)}
        </Card.Content>
      </Card>
    ));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/inethi-logo-large.png')} />
      </View>
      {renderCategoryCards(categories)}
      <View style={styles.card}>
        <ServiceContainer />
      </View>
      <Portal>
        {isLoading && (
          <Dialog visible={true}>
            <Dialog.Content>
              <ActivityIndicator size="large" />
            </Dialog.Content>
          </Dialog>
        )}
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  title: {
    marginBottom: 8,
    color: '#4285F4',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#4285F4',
  },
  buttonText: {
    color: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  input: {
    marginBottom: 8,
  },
  walletAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  walletAddress: {
    flex: 1,
  },
});

export default HomePage;
