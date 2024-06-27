import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Button, Card, Title, Dialog, Portal, TextInput, Paragraph, Snackbar } from 'react-native-paper';
import { useNavigate } from 'react-router-native';
import { Linking } from 'react-native';
import UploadModal from '../components/UploadModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HomePage = ({ logout }) => {

    const navigate = useNavigate();
    const [categories, setCategories] = useState({
      Wallet: [
        { name: "Create Wallet", action: () => handleCreateWalletClick() },
        { name: "Check Balance", action: () => handleCheckBalanceClick() },
        { name: "Transfer", action: () => navigate('/payment') },
      ],

    });

  const [isCreateWalletDialogOpen, setIsCreateWalletDialogOpen] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [balance, setBalance] = useState('');


  const handleCreateWalletClick = () => {
    setIsCreateWalletDialogOpen(true);
  };

  const handleCheckBalanceClick = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.get('https://manage-backend.inethilocal.net/wallet/balance/', config);
      setIsLoading(false);
      setBalance(response.data.balance);
      setIsBalanceDialogOpen(true);
    } catch (error) {
      setIsLoading(false);
      console.error('Error checking balance:', error);
      if (error.response) {
        if (error.response.status === 401) {
          alert('Authentication credentials were not provided.');
        } else if (error.response.status === 400) {
          alert('User does not exist.');
        } else if (error.response.status === 500) {
          alert('Error checking balance. Please contact iNethi support.');
        } else {
          alert(`Failed to check balance: ${error.message}`);
        }
      } else {
        alert(`Failed to check balance: ${error.message}`);
      }
    }
  };




  const handleCreateWallet = async () => {
    try {
      const token = await getToken();

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      const response = await axios.post(
          'https://manage-backend.inethilocal.net/wallet/create/',
          { wallet_name: walletName },
          config
      );
      setIsCreateWalletDialogOpen(false);
      if (response.status === 201) {
        alert(`Wallet created successfully! Address: ${response.data.address}, Name: ${response.data.name}`);
      }

    } catch (error) {
      console.error('Error creating wallet:', error);
      setIsCreateWalletDialogOpen(false);
      if (error.response) {
        if (error.response.status === 401) {
          alert('Authentication credentials were not provided.');
        } else if (error.response.status === 400) {
          alert('You already have a wallet.');
        } else if (error.response.status === 403) {
          alert('You do not have permission to create a wallet.');
        }
        else if (error.response.status === 500) {
          alert('Error creating wallet. Please contact iNethi support.');
        } else {
          alert(`Failed to create wallet: ${error.message}`);
        }
      } else {
        alert(`Failed to create wallet: ${error.message}`);
      }
    }
  };

  const getToken = async () => {
    let token = await AsyncStorage.getItem('userToken');
    if (!token) {
      setError('Authentication token not found');
      logout();
      return null;
    }

    if (await isTokenExpired()) {
      try {
        token = await getNewToken();
      } catch (refreshError) {
        setError('Failed to refresh token: ' + refreshError.message);
        logout();
        return null;
      }
    }

    return token;
  };
  const storeToken = async (token, expiresIn) => {
    const expiryDate = new Date().getTime() + expiresIn * 1000;
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('tokenExpiry', expiryDate.toString());
  };
  const isTokenExpired = async () => {
    const expiryDate = await AsyncStorage.getItem('tokenExpiry');
    return new Date().getTime() > parseInt(expiryDate);
  };

  const getNewToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await axios.post('https://keycloak.inethicloud.net/realms/inethi-global-services/protocol/openid-connect/token', {
        client_id: 'inethi-app',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, expires_in, refresh_token: newRefreshToken } = response.data;
      await storeToken(access_token, expires_in);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      console.log(`New token ${access_token}`)
      return access_token;
    } catch (error) {
      if (error.response) {
        console.error('Refresh Token Error:', error.response.data);
        if (error.response.data.error === 'invalid_grant') {
          console.error('The refresh token is invalid or expired.');
          logout();
        }
      } else {
        console.error('Refresh Token Error:', error.message);
      }
      throw new Error('Failed to refresh token');
    }
  };


  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const urlLocal = 'https://manage-backend.inethilocal.net/service/list-by-type/';
        const urlGlobal = 'https://manage-backend.inethicloud.net/service/list-by-type/';

        let servicesDataGlobal = {};
        let servicesDataLocal = {};

        try {
          const responseGlobal = await axios.get(urlGlobal, config);
          servicesDataGlobal = responseGlobal.data.data;
        } catch (err) {
          console.error(`Error fetching global data. You may not have Internet.`);
        }

        try {
          const responseLocal = await axios.get(urlLocal, config);
          servicesDataLocal = responseLocal.data.data;
        } catch (err) {
          console.error(`Error fetching local data. Are you connected to an iNethi network?`);
        }

        const combinedServices = { ...servicesDataGlobal };

        Object.entries(servicesDataLocal).forEach(([category, services]) => {
          combinedServices[category] = services;
        });

        const fetchedCategories = {};
        Object.entries(combinedServices).forEach(([category, services]) => {
          fetchedCategories[category] = services.map(service => ({
            name: service.name,
            url: service.url,
            action: () => navigate('/webview', { state: { url: service.url } })
          }));
        });

        setCategories(prevCategories => ({
          Wallet: prevCategories.Wallet,
          ...fetchedCategories
        }));
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(`Failed to fetch services: ${err.message}`);
      }
    };

    fetchServices();
  }, []);

  const openURL = (url) => {
    navigate('/webview', { state: { url } });
  };

  const renderButtons = (buttons) => {
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const pair = buttons.slice(i, i + 2);
      buttonRows.push(
        <View key={i} style={styles.buttonRow}>
          {pair.map(({ name, action, url }, idx) => (
            <Button
              key={idx}
              mode="contained"
              onPress={() => {
                if (action) {
                  action();
                } else if (url) {
                  openURL(url);
                } else {
                  console.error('Button has no action or URL');
                }
              }}
              style={styles.button}
            >
              {name}
            </Button>
          ))}
        </View>
      );
    }
    return buttonRows;
  };
  
  

  const renderCategoryCards = () => (
    Object.entries(categories).map(([category, buttons], index) => (
      <Card key={index} style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>{category}</Title>
          {renderButtons(buttons)}
        </Card.Content>
      </Card>
    ))
  );

  return (
    <View style={styles.container}>

    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/inethi-logo-large.png')}
      />
    </View>

    {renderCategoryCards()}
      <Portal>
        <Dialog visible={isCreateWalletDialogOpen} onDismiss={() => setIsCreateWalletDialogOpen(false)}>
          <Dialog.Title>Create Wallet</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Please enter a name for your new wallet.</Paragraph>
            <TextInput
                label="Wallet Name"
                value={walletName}
                onChangeText={text => setWalletName(text)}
                style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsCreateWalletDialogOpen(false)}>Cancel</Button>
            <Button onPress={handleCreateWallet}>Create</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={isBalanceDialogOpen} onDismiss={() => setIsBalanceDialogOpen(false)}>
          <Dialog.Title>Wallet Balance</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Your balance is: {balance}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsBalanceDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
        {isLoading && (
            <Dialog visible={true}>
              <Dialog.Content>
                <ActivityIndicator size="large" />
              </Dialog.Content>
            </Dialog>
        )}
      </Portal>
    </View>
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
});

export default HomePage;
