import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
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
import {useBalance} from '../context/BalanceContext';
import ServiceContainer from '../components/ServiceContainer';

const HomePage = ({logout}) => {
  const baseURL = 'http://172.16.13.141:8000';
  const walletCreateEndpoint = '/wallet/create/';
  const walletOwnershipEndpoint = '/wallet/ownership/';
  const walletDetailsEndpoint = '/wallet/details/';
  const [hasWallet, setHasWallet] = useState(false);
  const [showWalletCategories, setShowWalletCategories] = useState(false);
  const navigate = useNavigate();
  const [isCreateWalletDialogOpen, setIsCreateWalletDialogOpen] =
    useState(false);
  const [walletName, setWalletName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletDetails, setWalletDetails] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const {balance, fetchBalance} = useBalance();

  const [walletCategories] = useState([
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
      action: () => handleAddRecipientClick(),
      requiresWallet: true,
    },
    {
      name: 'View Recipients',
      action: () => handleViewRecipientsClick(),
      requiresWallet: true,
    },
  ]);

  const [categories, setCategories] = useState({});

  const handleViewRecipientsClick = () => {
    navigate('/view-recipients');
  };

  const handleAddRecipientClick = () => {
    navigate('/add-recipient');
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

      const urlLocal = 'http://172.16.13.141:8000';
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

  const renderCategoryCards = categories =>
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
      {!showWalletCategories ? (
        <>
          {renderCategoryCards(categories)}
          <Button
            mode="contained"
            onPress={() => setShowWalletCategories(true)}
            style={styles.button}>
            Wallet
          </Button>
          <View style={styles.card}>
            <ServiceContainer />
          </View>
        </>
      ) : (
        renderCategoryCards({Wallet: walletCategories})
      )}
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
});

export default HomePage;
