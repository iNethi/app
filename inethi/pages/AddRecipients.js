import React, {useState} from 'react';
import {View, StyleSheet, Alert, ScrollView} from 'react-native';
import {Button, TextInput, Dialog, Portal, Paragraph} from 'react-native-paper';
import {useNavigate} from 'react-router-native';
import {addRecipient} from '../service/recipient';

const AddRecipientScreen = () => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientWalletAddress, setRecipientWalletAddress] = useState('');
  const [recipientWalletName, setRecipientWalletName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAddRecipient = async () => {
    setIsLoading(true);
    try {
      await addRecipient(
        recipientName,
        recipientWalletAddress,
        recipientWalletName,
      );
      alert('Recipient added successfully');
      navigate(-1); // Navigate back to the previous screen
    } catch (error) {
      setError(`Error adding recipient: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        label="Recipient Name"
        value={recipientName}
        onChangeText={text => setRecipientName(text)}
        style={styles.input}
      />
      <TextInput
        label="Recipient Wallet Address"
        value={recipientWalletAddress}
        onChangeText={text => setRecipientWalletAddress(text)}
        style={styles.input}
      />
      <TextInput
        label="Recipient Wallet Name"
        value={recipientWalletName}
        onChangeText={text => setRecipientWalletName(text)}
        style={styles.input}
      />
      {error && <Paragraph style={styles.error}>{error}</Paragraph>}
      <Button mode="contained" onPress={handleAddRecipient} loading={isLoading}>
        Add Recipient
      </Button>

      <Button onPress={() => navigate(-1)}>Go Back</Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
});

export default AddRecipientScreen;
