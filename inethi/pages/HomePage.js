import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
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
import * as amplitude from '@amplitude/analytics-react-native';
import analytics from '@react-native-firebase/analytics';
import Ionicons from 'react-native-vector-icons/Ionicons';

amplitude.init('d641bfb8c1944a8894e65cc64309318e');

const HomePage = ({logout}) => {
  const baseURL = 'https://manage-backend.inethicloud.net';
  const nextcloudURL = 'https://nextcloud.inethicloud.net'; // iNethi Nextcloud URL

  const [hasWallet, setHasWallet] = useState(false);
  const navigate = useNavigate();
  const [isCreateWalletDialogOpen, setIsCreateWalletDialogOpen] =
    useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectedToWireless, setIsConnectedToWireless] = useState(false);
  const [isConnectedToInternet, setIsConnectedToInternet] = useState(false);
  const {balance, fetchBalance} = useBalance();

  const [categories, setCategories] = useState({
    Wallet: [
      {
        name: 'Wallet',
        action: () => navigate('/wallet-categories'),
        url: '', // Add an empty URL field to maintain structure
      },
    ],
    Navigator: [{name: 'FindHotspot', action: () => handleFindHotspotClick()}],
  });
  const handleFindHotspotClick = () => {
    const eventName = 'find_hotspot_button_clicked';

    // Log event to Firebase Analytics
    analytics()
      .logEvent(eventName, {
        button: 'FindHotspot',
      })
      .then(() => {
        console.log(`Firebase Analytics event logged: ${eventName}`);
      })
      .catch(error => {
        console.error(`Error logging event to Firebase Analytics: ${error}`);
      });

    // Log event to Amplitude
    amplitude.track(eventName, {
      button: 'FindHotspot',
    });

    const navigateEventName = 'navigate_to_map';

    // Log event to Firebase Analytics
    analytics()
      .logEvent(navigateEventName, {
        feature: 'Map',
      })
      .then(() => {
        console.log(`Firebase Analytics event logged: ${navigateEventName}`);
      })
      .catch(error => {
        console.error(`Error logging event to Firebase Analytics: ${error}`);
      });

    // Log event to Amplitude
    amplitude.track(navigateEventName, {
      feature: 'Map',
    });

    navigate('/map');
  };

  useEffect(() => {
    const checkStatuses = async () => {
      await checkWirelessConnection();
      await checkInternetConnection();
    };

    checkStatuses(); // Check statuses when the component mounts

    const intervalId = setInterval(() => {
      checkStatuses(); // Check statuses every 30 seconds
    }, 30000);

    return () => clearInterval(intervalId); // Cleanup the interval on component unmount
  }, []);

  const checkInternetConnection = async () => {
    try {
      const response = await fetch('https://www.google.com', {method: 'HEAD'});
      if (response.ok) {
        setIsConnectedToInternet(true);
      } else {
        setIsConnectedToInternet(false);
      }
    } catch (error) {
      setIsConnectedToInternet(false);
    }
  };

  const checkWirelessConnection = async () => {
    try {
      const response = await fetch(nextcloudURL, {method: 'HEAD'});
      if (response.ok) {
        setIsConnectedToWireless(true);
      } else {
        setIsConnectedToWireless(false);
      }
    } catch (error) {
      setIsConnectedToWireless(false);
    }
  };

  const handleFindHotspotClick = () => {
    const eventName = 'find_hotspot_button_clicked';

    // Log event to Firebase Analytics
    analytics()
      .logEvent(eventName, {
        button: 'FindHotspot',
      })
      .then(() => {
        console.log(`Firebase Analytics event logged: ${eventName}`);
      })
      .catch(error => {
        console.error(`Error logging event to Firebase Analytics: ${error}`);
      });

    // Log event to Amplitude
    amplitude.track(eventName, {
      button: 'FindHotspot',
    });

    const navigateEventName = 'navigate_to_map';

    // Log event to Firebase Analytics
    analytics()
      .logEvent(navigateEventName, {
        feature: 'Map',
      })
      .then(() => {
        console.log(`Firebase Analytics event logged: ${navigateEventName}`);
      })
      .catch(error => {
        console.error(`Error logging event to Firebase Analytics: ${error}`);
      });

    // Log event to Amplitude
    amplitude.track(navigateEventName, {
      feature: 'Map',
    });

    navigate('/map');
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
                disabled={isDisabled}
                icon={() => {
                  if (name === 'FindHotspot') {
                    return (
                      <Ionicons name="map-outline" size={20} color="#FFFFFF" />
                    ); // Replaced icon with map icon
                  }
                  return null;
                }}>
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

  const InternetDataCard = () => {
    const totalData = 20; // Total data in GB
    const remainingData = 19; // Remaining data in GB
    const usedData = totalData - remainingData;
    const progress = remainingData / totalData;

    return (
      <Card style={styles.internetDataCard}>
        <View style={styles.internetDataContent}>
          <Ionicons name="download-outline" size={30} color="#FFFFFF" />
          <View>
            <Text style={styles.internetDataTitle}>Internet Data</Text>
            <Text style={styles.internetDataText}>
              {remainingData}GB left of {totalData}GB Data
            </Text>
          </View>
        </View>
        <View style={styles.internetDataBarContainer}>
          <View
            style={[
              styles.internetDataBar,
              {
                width: `${progress * 100}%`,
                backgroundColor: progress > 0.5 ? '#76c7c0' : '#ff9800',
              },
            ]}
          />
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusContainer}>
        <Card style={styles.statusCard}>
          <View style={styles.statusContent}>
            <Ionicons name="wifi" size={30} color="#FFFFFF" />
            <Text style={styles.statusTitle}>iNethi Wireless</Text>
            <View style={styles.statusIndicatorContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  {backgroundColor: isConnectedToWireless ? 'green' : 'red'},
                ]}
              />
              <Text style={styles.statusText}>
                {isConnectedToWireless ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
        </Card>
        <Card style={styles.statusCard}>
          <View style={styles.statusContent}>
            <Ionicons name="globe" size={30} color="#FFFFFF" />
            <Text style={styles.statusTitle}>Internet</Text>
            <View style={styles.statusIndicatorContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  {backgroundColor: isConnectedToInternet ? 'green' : 'red'},
                ]}
              />
              <Text style={styles.statusText}>
                {isConnectedToInternet ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
        </Card>
      </View>
      <InternetDataCard />
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  statusCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#4285F4',
    borderRadius: 10,
    padding: 10,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusIndicator: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 5,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  internetDataCard: {
    backgroundColor: '#4285F4',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  internetDataContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  internetDataTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  internetDataText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },
  internetDataBarContainer: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  internetDataBar: {
    height: 5,
    borderRadius: 5,
  },
});

export default HomePage;
