/* eslint-disable */
import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Alert, PermissionsAndroid, Platform } from 'react-native';
import {Button, Card, Title, Dialog, Portal, TextInput, Paragraph, IconButton} from 'react-native-paper';
import { useNavigate } from 'react-router-native';
import axios from 'axios';
import { getToken } from '../utils/tokenUtils';
import { useBalance } from '../context/BalanceContext'; // Import useBalance
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import RNFS from 'react-native-fs';


const HomePage = ({logout}) => {
  const baseURL = 'https://manage-backend.inethicloud.net';
  const walletCreateEndpoint = '/wallet/create/';
  const walletOwnershipEndpoint = '/wallet/ownership/';
  const walletDetailsEndpoint = '/wallet/details/';
  const [hasWallet, setHasWallet] = useState(false);
  const navigate = useNavigate();
  const [isCreateWalletDialogOpen, setIsCreateWalletDialogOpen] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBalanceDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [walletDetails, setWalletDetails] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const { balance, fetchBalance } = useBalance(); // Destructure balance and fetchBalance
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrCodeRef, setQrCodeRef]  = useState(null);
  const [categories, setCategories] = useState({
    Wallet: [
      {
        name: "Create Wallet",
        action: () => handleCreateWalletClick(),
        disabled: hasWallet
      },
      { name: "Wallet Details", action: () => handleCheckWalletDetails(), requiresWallet: true },
      { name: "Transfer", action: () => navigate('/payment'), requiresWallet: true },
      { name: "Wallet QR Code", action: () => handleShowQrCode(), requiresWallet: true },
    ],
  });

  const handleCreateWalletClick = () => {
    setIsCreateWalletDialogOpen(true);
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Number(Platform.Version) >= 33) {
          return true;
        }
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to your storage to save the QR code',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
        );
        console.log(`Results... ${granted}`)
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true; // iOS does not need this permission
    }
  };

// Function to download the QR code
  const handleDownloadQrCode = async () => {
    const hasPermission = await requestStoragePermission();

    if (!hasPermission) {
      alert('Permission to access storage was denied');
      return;
    }

    try {
      const svg = qrCodeRef;

      if (svg) {
        const filePath = `${RNFS.DownloadDirectoryPath}/qrcode.png`;

        const svgData = await new Promise((resolve, reject) => {
          svg.toDataURL((data) => {
            resolve(data);
          });
        });

        await RNFS.writeFile(filePath, svgData, 'base64');
        alert(`QR code saved to ${filePath}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save QR code');
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
          `${baseURL}${walletCreateEndpoint}`,
          { wallet_name: walletName },
          config
      );
      setIsCreateWalletDialogOpen(false);
      if (response.status === 201) {
        setHasWallet(true);
        alert(`Wallet created successfully! Address: ${response.data.address}, Name: ${response.data.name}`);
        fetchBalance(); // Refresh balance after creating a wallet
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      setIsCreateWalletDialogOpen(false);
      if (error.response) {
        if (error.response.status === 400) {
          alert('Cannot connect to the iNethi server. Please check your Internet connection.');
        } else if (error.response.status === 401) {
          alert('Authentication credentials were not provided.');
        } else if (error.response.status === 403) {
          alert('You do not have permission to create a wallet.');
        } else if (error.response.status === 409) {
          alert('You already have a wallet.');
        } else if (error.response.status === 500) {
          alert('Error creating wallet. Please contact iNethi support.');
        } else {
          alert(`Failed to create wallet: ${error.message}`);
        }
      } else {
        alert(`Failed to create wallet: ${error.message}`);
      }
    }
  };

  const checkWalletOwnership = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.get(`${baseURL}${walletOwnershipEndpoint}`, config);
      setHasWallet(response.data.has_wallet);
    } catch (error) {
      console.error('Error checking wallet ownership:', error);
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Error', 'Authentication credentials were not provided.');
        } else if (error.response.status === 404) {
          Alert.alert('Error', 'User does not exist.');
        } else if (error.response.status === 500) {
          Alert.alert('Error', 'Error checking wallet ownership. Please contact iNethi support.');
        } else {
          Alert.alert('Error', `Failed to check wallet ownership: ${error.message}`);
        }
      } else {
        Alert.alert('Error', `Failed to check wallet ownership: ${error.message}`);
      }
    }
  };

  const fetchWalletDetails = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      const response = await axios.get(`${baseURL}${walletDetailsEndpoint}`, config);
      setWalletDetails(response.data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Error', 'Authentication credentials were not provided.');
        } else if (error.response.status === 404) {
          Alert.alert('Error', 'User does not exist.');
        } else if (error.response.status === 417) {
          Alert.alert('Error', 'User does not have a wallet.');
        } else if (error.response.status === 500) {
          Alert.alert('Error', 'Error checking wallet details. Please contact iNethi support.');
        } else {
          Alert.alert('Error', `Failed to check wallet details: ${error.message}`);
        }
      } else {
        Alert.alert('Error', `Failed to check wallet details: ${error.message}`);
      }
    }
  };

  const handleCheckWalletDetails = async () => {
    await fetchWalletDetails();
    setIsDetailDialogOpen(true);
  };

  const handleShowQrCode = async () => {
    await fetchWalletDetails();
    setIsQrDialogOpen(true);
  };

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

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
        const responseGlobal = await Promise.race([axios.get(urlGlobal, config), timeout(5000)]);
        servicesDataGlobal = responseGlobal.data.data;
      } catch (err) {
        console.error(`Error fetching global data. You may not have Internet.`);
      }

      try {
        const responseLocal = await Promise.race([axios.get(urlLocal, config), timeout(5000)]);
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

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          checkWalletOwnership(),
          fetchServices(),
          fetchBalance(),
        ]);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    setCategories({
      Wallet: [
        {
          name: "Create Wallet",
          action: () => handleCreateWalletClick(),
          disabled: hasWallet // Disable if the user already has a wallet
        },
        { name: "Wallet Details", action: () => handleCheckWalletDetails(), requiresWallet: true },
        { name: "Transfer", action: () => navigate('/payment'), requiresWallet: true },
        { name: "Wallet QR Code", action: () => handleShowQrCode(), requiresWallet: true },
      ],
    });
  }, [hasWallet]); // Update categories whenever hasWallet changes

  const openURL = (url) => {
    navigate('/webview', { state: { url } });
  };

  const renderButtons = (buttons) => {
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const pair = buttons.slice(i, i + 2);
      buttonRows.push(
          <View key={i} style={styles.buttonRow}>
            {pair.map(({ name, action, url, requiresWallet, disabled }, idx) => {
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
                      labelStyle={isDisabled ? styles.buttonTextDisabled : styles.buttonText}
                      disabled={isDisabled}
                  >
                    {name}
                  </Button>
              );
            })}
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

          {/* QR Code Dialog */}
          <Dialog visible={isQrDialogOpen} onDismiss={() => setIsQrDialogOpen(false)}>
            <Dialog.Title>Wallet QR Code</Dialog.Title>
            <Dialog.Content>
              {isLoading ? (
                  <ActivityIndicator size="large" />
              ) : walletDetails ? (
                  <View style={styles.qrCodeContainer}>
                    <QRCode
                        value={walletDetails.wallet_address}
                        size={200}
                        getRef={(ref) => setQrCodeRef(ref)}
                    />

                    <Button
                        mode="contained"
                        onPress={handleDownloadQrCode}
                        style={styles.downloadButton}
                    >
                      Download QR Code
                    </Button>
                    <View style={styles.walletAddressContainer}>
                      <Paragraph style={styles.walletAddress}>Wallet Address: {walletDetails.wallet_address}</Paragraph>
                      <IconButton
                          icon="content-copy"
                          size={20}
                          onPress={() => {
                            Clipboard.setString(walletDetails.wallet_address);
                            Alert.alert('Copied', 'Wallet address copied to clipboard');
                          }}
                      />
                    </View>
                  </View>
              ) : detailsError ? (
                  <Paragraph>{detailsError}</Paragraph>
              ) : (
                  <Paragraph>Failed to load wallet details.</Paragraph>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsQrDialogOpen(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={isBalanceDialogOpen} onDismiss={() => setIsDetailDialogOpen(false)}>
            <Dialog.Title>Wallet Details</Dialog.Title>
            <Dialog.Content>
              {isLoading ? (
                  <ActivityIndicator size="large" />
              ) : walletDetails ? (
                  <>
                    <View style={styles.walletAddressContainer}>
                      <Paragraph style={styles.walletAddress}>Wallet Address: {walletDetails.wallet_address}</Paragraph>
                      <IconButton
                          icon="content-copy"
                          size={20}
                          onPress={() => {
                            Clipboard.setString(walletDetails.wallet_address);
                            Alert.alert('Copied', 'Wallet address copied to clipboard');
                          }}
                      />
                    </View>
                    <Paragraph>Balance: {walletDetails.balance}</Paragraph>
                  </>
              ) : detailsError ? (
                  <Paragraph>{detailsError}</Paragraph>
              ) : (
                  <Paragraph>Failed to load wallet details.</Paragraph>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsDetailDialogOpen(false)}>Close</Button>
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
  buttonDisabled: {
    backgroundColor: '#d3d3d3',
  },
  buttonText: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#A9A9A9',
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
  downloadButton: {
    marginTop: 20,
  },

  walletAddress: {
    flex: 1,
  },
});

export default HomePage;
