import React, {createContext, useContext, useState, useEffect} from 'react';
import axios from 'axios';
import {getToken} from '../utils/tokenUtils';

const BalanceContext = createContext();

export const BalanceProvider = ({children, logout}) => {
  const [balance, setBalance] = useState('Loading...');
  // const baseURL = 'https://manage-backend.inethicloud.net';
  const baseURL = 'http://172.16.13.141:9000';

  const balanceEndpoint = '/wallet/balance/';
  const walletOwnershipEndpoint = '/wallet/ownership/';

  const fetchBalance = async () => {
    try {
      const token = await getToken(logout);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const ownershipResponse = await axios.get(
        `${baseURL}${walletOwnershipEndpoint}`,
        config,
      );
      if (ownershipResponse.data.has_wallet) {
        const balanceResponse = await axios.get(
          `${baseURL}${balanceEndpoint}`,
          config,
        );
        setBalance(balanceResponse.data.balance);
      } else {
        setBalance(0);
      }
    } catch (err) {
      console.error('Error:', err);
      setBalance('Error fetching balance');
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <BalanceContext.Provider value={{balance, fetchBalance}}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
