import React, { useState, useEffect } from 'react';
import { Appbar } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';

const AppBarComponent = () => {
  const [balance, setBalance] = useState('Loading...');

  useEffect(() => {
    const fetchBalance = async () => {
      const rpcUrl = 'https://forno.celo.org';
      const contractAddress = '0x8Bab657c88eb3c724486D113E650D2c659aa23d2';
      const walletAddress = '0xb89222b1B2fdE607e28B3c1C06BDA2696C3f0765';
      
      const data = {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: '0x70a08231000000000000000000000000' + walletAddress.substring(2)
        }, 'latest'],
        id: 1
      };

      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        const json = await response.json();
        console.log("API Response:", json); // Log the raw API response

        const balanceInWei = BigInt(json.result);
        console.log("Balance in Wei (BigInt):", balanceInWei.toString()); // Log the balance in wei as a BigInt

        // Adjust the division for token's decimal places (e.g., 6 for KRONE)
        const tokenDecimals = 6;
        const balanceInToken = balanceInWei / BigInt(10 ** tokenDecimals);
        console.log("Balance in KRONE:", balanceInToken.toString()); // Log the converted balance in KRONE
        setBalance(`${balanceInToken.toString()}`);
      } catch (err) {
        console.error('Error:', err);
        setBalance('Error fetching balance');
      }
    };

    fetchBalance();
  }, []);

  return (
    <Appbar.Header style={styles.appBar}>
      <View style={styles.content}>
        <View>
          <Text style={styles.text}>{balance} KRONE</Text>
        </View>
        <View>
          <Text style={styles.text}>Status: Online</Text>
        </View>
        <View>
          <Text style={styles.text}>Data: 1GB</Text>
          <Text style={styles.text}>Time: 12:00</Text>
        </View>
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: '#4285F4',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
  },
});

export default AppBarComponent;
