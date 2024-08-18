import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigate, useLocation} from 'react-router-native';
import {Button} from 'react-native-paper';

const RecipientDetailsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {recipient} = location.state;

  const handlePay = () => {
    navigate('/payment', {state: {walletAddress: recipient.wallet_address}});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipient Details</Text>
      <Text style={styles.detail}>Name: {recipient.name}</Text>
      <Text style={styles.detail}>
        Wallet Address: {recipient.wallet_address}
      </Text>
      <Text style={styles.detail}>Wallet Name: {recipient.wallet_name}</Text>
      <Button mode="contained" onPress={handlePay} style={styles.button}>
        Pay
      </Button>
      <Button
        mode="contained"
        onPress={() => navigate(-1)}
        style={styles.button}>
        Go Back
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detail: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    width: '80%',
    alignSelf: 'center',
  },
});

export default RecipientDetailsScreen;
