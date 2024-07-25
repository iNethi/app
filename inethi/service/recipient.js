// api/recipientApi.js
import axios from 'axios';
import {getToken} from '../utils/tokenUtils';

const baseURL = 'http://172.16.13.141:8000';

export const addRecipient = async (name, wallet_address, wallet_name) => {
  try {
    const token = await getToken();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const response = await axios.post(
      `${baseURL}/wallet-recipients/create/`,
      {name, wallet_address, wallet_name},
      config,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchRecipients = async () => {
  try {
    const token = await getToken();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const response = await axios.get(
      `${baseURL}/wallet-recipients/list/`,
      config,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
