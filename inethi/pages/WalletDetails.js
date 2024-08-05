import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {Card, Title, Paragraph} from 'react-native-paper';
import {useLocation} from 'react-router-native';
import axios from 'axios';
import {getToken} from '../utils/tokenUtils';
import QRCode from 'react-native-qrcode-svg';

const WalletDetailsPage = () => {
  const location = useLocation();
  const {walletAddress} = location.state || {};
  const baseURL = 'http://172.16.13.141:8000';
  const walletDetailsEndpoint = `/wallet/${walletAddress}/qr_code/`;

  const [walletDetails, setWalletDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      fetchWalletDetails();
    } else {
      Alert.alert('Error', 'No wallet address provided.');
      setIsLoading(false);
    }
  }, [walletAddress]);

  const fetchWalletDetails = async () => {
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Wallet Details</Title>
          {walletDetails ? (
            <>
              <Paragraph>
                Wallet Address: {walletDetails.wallet_address}
              </Paragraph>
              <QRCode
                value={`${baseURL}/wallet/${walletDetails.wallet_address}/qr_code/`}
                size={200}
              />
            </>
          ) : (
            <Paragraph>Error loading wallet details.</Paragraph>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WalletDetailsPage;
