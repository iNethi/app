// // api/recipientApi.js
// import axios from 'axios';
// import {getToken} from '../utils/tokenUtils';

// const baseURL = 'http://172.16.13.141:9000';

// export const addRecipient = async (name, wallet_address, wallet_name) => {
//   try {
//     const token = await getToken();
//     const config = {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     };
//     const response = await axios.post(
//       `${baseURL}/wallet-recipients/create/`,
//       {name, wallet_address, wallet_name},
//       config,
//     );
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const fetchRecipients = async () => {
//   try {
//     const token = await getToken();
//     const config = {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     };
//     const response = await axios.get(
//       `${baseURL}/wallet-recipients/list/`,
//       config,
//     );
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// service/recipient.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECIPIENTS_KEY = 'recipients';

// Store recipients in AsyncStorage
export const addRecipient = async (name, wallet_address, wallet_name) => {
  try {
    const recipients = await fetchRecipients();
    const newRecipient = {name, wallet_address, wallet_name};
    const updatedRecipients = [...recipients, newRecipient];
    await AsyncStorage.setItem(
      RECIPIENTS_KEY,
      JSON.stringify(updatedRecipients),
    );
    return updatedRecipients;
  } catch (error) {
    throw new Error('Failed to add recipient');
  }
};

// Fetch recipients from AsyncStorage
export const fetchRecipients = async () => {
  try {
    const storedRecipients = await AsyncStorage.getItem(RECIPIENTS_KEY);
    return storedRecipients ? JSON.parse(storedRecipients) : [];
  } catch (error) {
    throw new Error('Failed to fetch recipients');
  }
};
