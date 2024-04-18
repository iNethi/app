import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Card, Title } from 'react-native-paper';
import { useNavigate } from 'react-router-native';
import { Linking } from 'react-native';
import UploadModal from '../components/UploadModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HomePage = ({ logout }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState({
      Wallet: [
        { name: "Generate", action: () => Linking.openURL('https://sarafu.network') },
        { name: "Connect Wallet", action: () => setIsModalVisible(true) },
        { name: "Pay", action: () => navigate('/payment') },
      ],
    });
    const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState('');


// Handling success and error from upload
  const handleUploadSuccess = (result) => {
    console.log('Upload success:', result);
    setIsModalVisible(false);
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
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
  const refreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken'); // Retrieve the refresh token from storage
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await axios.post('https://keycloak.inethilocal.net/auth/realms/inethi-global-services/protocol/openid-connect/token', {
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

      return access_token;
    } catch (error) {
      console.error('Refresh Token Error:', error);

      throw new Error('Failed to refresh token');
    }
  };


  useEffect(() => {
    const fetchServices = async () => {
      try {
        let token = await AsyncStorage.getItem('userToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        // console.log(refreshToken)
        if (!token) {
          setError('Authentication token not found');

          return;
        }
        if (await isTokenExpired()) {
          try {
            // token = await refreshToken();
            console.log('token expired')
            logout()
            return;
          } catch (refreshError) {
            setError('Failed to refresh token: ' + refreshError.message);
            return;
          }
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const response = await axios.get('http://10.0.2.2:8000/service/list-by-type/', config);
        console.log('API Service Response:', response.data);

        // response.data.data is an object with keys as category names and values as arrays
        const fetchedCategories = {};
        Object.entries(response.data.data).forEach(([category, services]) => {
          fetchedCategories[category] = services.map(service => ({
            name: service.name,
            url: service.url,
            action: () => navigate('/webview', { state: { url: service.url } })
          }));
        });

        // Ensure Wallet category is always present
        setCategories(prevCategories => ({
          Wallet: prevCategories.Wallet,
          ...fetchedCategories
        }));
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to fetch services: ' + err.message);
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
    <UploadModal
  isVisible={isModalVisible}
  onDismiss={() => setIsModalVisible(false)}
  onSuccess={handleUploadSuccess}
  onError={handleUploadError}
/>

     
    {renderCategoryCards()}

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
