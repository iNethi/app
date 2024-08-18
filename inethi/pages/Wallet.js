import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  IconButton,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  TextInput,
  Dialog,
  Portal,
} from 'react-native-paper';
import {useNavigate} from 'react-router-native';
import axios from 'axios';
import {getToken} from '../utils/tokenUtils';
import {useBalance} from '../context/BalanceContext';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';

const WalletCategoriesPage = () => {
  const baseURL = 'http://172.16.13.141:9000';
  const walletCreateEndpoint = '/wallet/create/';
  const walletOwnershipEndpoint = '/wallet/ownership/';
  const walletDetailsEndpoint = '/wallet/details/';
  const navigate = useNavigate();
  const {balance, fetchBalance} = useBalance();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const [hasWallet, setHasWallet] = useState(false);
  const [isCreateWalletDialogOpen, setIsCreateWalletDialogOpen] =
    useState(false);
  const [walletName, setWalletName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletDetails, setWalletDetails] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const [isBalanceDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    checkWalletOwnership();
  }, []);

  const handleCreateWalletClick = () => {
    setIsCreateWalletDialogOpen(true);
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
      const response = await axios.get(
        `${baseURL}${walletDetailsEndpoint}`,
        config,
      );
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
          Alert.alert(
            'Error',
            'Error checking wallet details. Please contact iNethi support.',
          );
        } else {
          Alert.alert(
            'Error',
            `Failed to check wallet details: ${error.message}`,
          );
        }
      } else {
        Alert.alert(
          'Error',
          `Failed to check wallet details: ${error.message}`,
        );
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
        `${baseURL}${walletCreateEndpoint}`,
        {wallet_name: walletName},
        config,
      );
      setIsCreateWalletDialogOpen(false);
      if (response.status === 201) {
        setHasWallet(true);
        alert(
          `Wallet created successfully! Address: ${response.data.address}, Name: ${response.data.name}`,
        );
        fetchBalance();
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      setIsCreateWalletDialogOpen(false);
      if (error.response) {
        if (error.response.status === 400) {
          alert(
            'Cannot connect to the iNethi server. Please check your Internet connection.',
          );
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

      const response = await axios.get(
        `${baseURL}${walletOwnershipEndpoint}`,
        config,
      );
      setHasWallet(response.data.has_wallet);
    } catch (error) {
      console.error('Error checking wallet ownership:', error);
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Error', 'Authentication credentials were not provided.');
        } else if (error.response.status === 404) {
          Alert.alert('Error', 'User does not exist.');
        } else if (error.response.status === 500) {
          Alert.alert(
            'Error',
            'Error checking wallet ownership. Please contact iNethi support.',
          );
        } else {
          Alert.alert(
            'Error',
            `Failed to check wallet ownership: ${error.message}`,
          );
        }
      } else {
        Alert.alert(
          'Error',
          `Failed to check wallet ownership: ${error.message}`,
        );
      }
    }
  };

  const handleCheckWalletDetails = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      const response = await axios.get(
        `${baseURL}${walletDetailsEndpoint}`,
        config,
      );
      setWalletDetails(response.data);
      setIsLoading(false);
      navigate(`/wallet-details`, {
        state: {walletAddress: response.data.wallet_address},
      });
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
          Alert.alert(
            'Error',
            'Error checking wallet details. Please contact iNethi support.',
          );
        } else {
          Alert.alert(
            'Error',
            `Failed to check wallet details: ${error.message}`,
          );
        }
      } else {
        Alert.alert(
          'Error',
          `Failed to check wallet details: ${error.message}`,
        );
      }
    }
  };

  const handleShowQrCode = async () => {
    await fetchWalletDetails();
    setIsQrDialogOpen(true);
  };

  const walletCategories = [
    {
      name: 'Create Wallet',
      action: handleCreateWalletClick,
      disabled: hasWallet,
    },
    {
      name: 'Wallet Details',
      action: handleCheckWalletDetails,
      requiresWallet: true,
    },
    {
      name: 'Transfer',
      action: () => navigate('/payment'),
      requiresWallet: true,
    },
    {
      name: 'Add Recipients',
      action: () => navigate('/add-recipient'),
      requiresWallet: true,
    },
    {
      name: 'View Recipients',
      action: () => navigate('/view-recipients'),
      requiresWallet: true,
    },
    {
      name: 'Wallet QR Code',
      action: () => handleShowQrCode(),
      requiresWallet: true,
    },
  ];

  const renderButtons = buttons => {
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const pair = buttons.slice(i, i + 2);
      buttonRows.push(
        <View key={i} style={styles.buttonRow}>
          {pair.map(({name, action, requiresWallet}, idx) => {
            const isDisabled = requiresWallet && !hasWallet;
            return (
              <Button
                key={idx}
                mode="contained"
                onPress={action}
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

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Wallet Categories</Title>
          {renderButtons(walletCategories)}
        </Card.Content>
      </Card>
      <Button
        mode="contained"
        onPress={() => navigate('/')}
        style={styles.button}>
        Go Back
      </Button>
      <Portal>
        <Dialog
          visible={isCreateWalletDialogOpen}
          onDismiss={() => setIsCreateWalletDialogOpen(false)}>
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
            <Button onPress={() => setIsCreateWalletDialogOpen(false)}>
              Cancel
            </Button>
            <Button onPress={handleCreateWallet}>Create</Button>
          </Dialog.Actions>
        </Dialog>
        {/* QR Code Dialog */}
        <Dialog
          visible={isQrDialogOpen}
          onDismiss={() => setIsQrDialogOpen(false)}>
          <Dialog.Title>Wallet QR Code</Dialog.Title>
          <Dialog.Content>
            {isLoading ? (
              <ActivityIndicator size="large" />
            ) : walletDetails ? (
              <View style={styles.qrCodeContainer}>
                <QRCode value={walletDetails.wallet_address} size={200} />
                <View style={styles.walletAddressContainer}>
                  <Paragraph style={styles.walletAddress}>
                    Wallet Address: {walletDetails.wallet_address}
                  </Paragraph>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => {
                      Clipboard.setString(walletDetails.wallet_address);
                      Alert.alert(
                        'Copied',
                        'Wallet address copied to clipboard',
                      );
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
        <Dialog
          visible={isBalanceDialogOpen}
          onDismiss={() => setIsDetailDialogOpen(false)}>
          <Dialog.Title>Wallet Details</Dialog.Title>
          <Dialog.Content>
            {isLoading ? (
              <ActivityIndicator size="large" />
            ) : walletDetails ? (
              <>
                <View style={styles.walletAddressContainer}>
                  <Paragraph style={styles.walletAddress}>
                    Wallet Address: {walletDetails.wallet_address}
                  </Paragraph>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => {
                      Clipboard.setString(walletDetails.wallet_address);
                      Alert.alert(
                        'Copied',
                        'Wallet address copied to clipboard',
                      );
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
    marginBottom: 10, // Add margin for spacing
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
  input: {
    marginBottom: 8,
  },
});

export default WalletCategoriesPage;
