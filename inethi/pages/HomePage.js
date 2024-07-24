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
} from 'react-native-paper';
import {useNavigate} from 'react-router-native';
import axios from 'axios';
import {getToken} from '../utils/tokenUtils';
import {useBalance} from '../context/BalanceContext'; // Import useBalance
import ServiceContainer from '../components/ServiceContainer';
import Metric from '../service/Metric';
import {addRecipient, fetchRecipients} from '../service/recipient';

const HomePage = ({logout}) => {
  // const baseURL = 'https://manage-backend.inethicloud.net';
  const baseURL = 'http://172.16.13.141:8000';
  const walletCreateEndpoint = '/wallet/create/';
  const walletOwnershipEndpoint = '/wallet/ownership/';
  const walletDetailsEndpoint = '/wallet/details/';
  const [hasWallet, setHasWallet] = useState(false);
  const navigate = useNavigate();
  const [isCreateWalletDialogOpen, setIsCreateWalletDialogOpen] =
    useState(false);
  const [walletName, setWalletName] = useState('');
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBalanceDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [walletDetails, setWalletDetails] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const {balance, fetchBalance} = useBalance(); // Destructure balance and fetchBalance
  //Wallet States
  const [isAddRecipientDialogOpen, setIsAddRecipientDialogOpen] =
    useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientWalletAddress, setRecipientWalletAddress] = useState('');
  const [recipientWalletName, setRecipientWalletName] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [isViewRecipientsDialogOpen, setIsViewRecipientsDialogOpen] =
    useState(false);

  const [categories, setCategories] = useState({
    Wallet: [
      {name: 'Create Wallet', action: () => handleCreateWalletClick()},
      {
        name: 'Wallet Details',
        action: () => handleCheckWalletDetails(),
        requiresWallet: true,
      },
      {
        name: 'Transfer',
        action: () => navigate('/payment'),
        requiresWallet: true,
      },
      {
        name: 'Add Recipients',
        action: () => setIsAddRecipientDialogOpen(true),
        requiresWallet: true,
      },
      {
        name: 'View Recipients',
        action: () => handleViewRecipientsClick(),
        requiresWallet: true,
      },
    ],
  });

  //Recipient Functions
  const handleAddRecipient = async () => {
    try {
      const result = await addRecipient(
        recipientName,
        recipientWalletAddress,
        recipientWalletName,
      );
      alert(`Recipient added successfully: ${result.message}`);
      setIsAddRecipientDialogOpen(false);
    } catch (error) {
      alert(`Error adding recipient: ${error.message}`);
    }
  };

  // const handleViewRecipientsClick = async () => {
  //   try {
  //     const result = await fetchRecipients();
  //     setRecipients(result);
  //     setIsViewRecipientsDialogOpen(true);
  //   } catch (error) {
  //     alert(`Error fetching recipients: ${error.message}`);
  //   }
  // };

  const groupRecipientsByAlphabet = recipients => {
    return recipients.reduce((groups, recipient) => {
      const firstLetter = recipient.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(recipient);
      return groups;
    }, {});
  };

  const handleViewRecipientsClick = async () => {
    try {
      const result = await fetchRecipients();
      const groupedRecipients = groupRecipientsByAlphabet(result);
      setRecipients(groupedRecipients);
      setIsViewRecipientsDialogOpen(true);
    } catch (error) {
      alert(`Error fetching recipients: ${error.message}`);
    }
  };

  const handleCreateWalletClick = () => {
    setIsCreateWalletDialogOpen(true);
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
        fetchBalance(); // Refresh balance after creating a wallet
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

  const handleCheckWalletDetails = async () => {
    await fetchWalletDetails();
    setIsDetailDialogOpen(true);
  };

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

      const urlLocal =
        // 'https://manage-backend.inethilocal.net/service/list-by-type/';
        'http://172.16.13.141:8000';

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

      const fetchedCategories = {};
      Object.entries(combinedServices).forEach(([category, services]) => {
        fetchedCategories[category] = services.map(service => ({
          name: service.name,
          url: service.url,
          action: () => navigate('/webview', {state: {url: service.url}}),
        }));
      });

      setCategories(prevCategories => ({
        Wallet: prevCategories.Wallet,
        ...fetchedCategories,
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

  const openURL = url => {
    navigate('/webview', {state: {url}});
  };

  const renderButtons = buttons => {
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const pair = buttons.slice(i, i + 2);
      buttonRows.push(
        <View key={i} style={styles.buttonRow}>
          {pair.map(({name, action, url, requiresWallet}, idx) => {
            const isDisabled = requiresWallet && !hasWallet;
            return (
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
      {renderCategoryCards()}
      <View style={styles.card}>
        <ServiceContainer />
      </View>
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
        <Dialog
          visible={isBalanceDialogOpen}
          onDismiss={() => setIsDetailDialogOpen(false)}>
          <Dialog.Title>Wallet Details</Dialog.Title>
          <Dialog.Content>
            {isLoading ? (
              <ActivityIndicator size="large" />
            ) : walletDetails ? (
              <>
                <Paragraph>
                  Wallet Address: {walletDetails.wallet_address}
                </Paragraph>
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

        <Dialog
          visible={isViewRecipientsDialogOpen}
          onDismiss={() => setIsViewRecipientsDialogOpen(false)}>
          <Dialog.Title>View Recipients</Dialog.Title>
          <Dialog.Content>
            {Object.keys(recipients).length > 0 ? (
              Object.keys(recipients)
                .sort()
                .map((letter, index) => (
                  <View key={index}>
                    <Title>{letter}</Title>
                    {recipients[letter].map((recipient, idx) => (
                      <Paragraph key={idx}>
                        {recipient.name} - {recipient.wallet_address} -{' '}
                        {recipient.wallet_name}
                      </Paragraph>
                    ))}
                  </View>
                ))
            ) : (
              <Paragraph>No recipients found.</Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsViewRecipientsDialogOpen(false)}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
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
  alphabetGroup: {
    marginTop: 10,
    marginBottom: 10,
  },
  alphabetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  recipientItem: {
    marginBottom: 5,
  },
});

export default HomePage;
