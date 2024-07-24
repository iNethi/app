import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const getToken = async logout => {
  let token = await AsyncStorage.getItem('userToken');
  if (!token) {
    return null;
  }

  if (await isTokenExpired()) {
    try {
      token = await getNewToken(logout);
    } catch (refreshError) {
      console.error('Failed to refresh token: ' + refreshError.message);
      logout();
      return null;
    }
  }

  return token;
};

export const storeToken = async (token, expiresIn) => {
  const expiryDate = new Date().getTime() + expiresIn * 1000;
  await AsyncStorage.setItem('userToken', token);
  await AsyncStorage.setItem('tokenExpiry', expiryDate.toString());
};

export const isTokenExpired = async () => {
  const expiryDate = await AsyncStorage.getItem('tokenExpiry');
  return new Date().getTime() > parseInt(expiryDate);
};

export const getNewToken = async logout => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post(
      'https://keycloak.inethilocal.net/realms/Test/protocol/openid-connect/token',
      {
        client_id: 'testclient',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const {
      access_token,
      expires_in,
      refresh_token: newRefreshToken,
    } = response.data;
    await storeToken(access_token, expires_in);
    await AsyncStorage.setItem('refreshToken', newRefreshToken);
    console.log(`New token ${access_token}`);
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
