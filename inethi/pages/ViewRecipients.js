import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Button, Title, Paragraph, ActivityIndicator} from 'react-native-paper';
import {useNavigate} from 'react-router-native';
import {fetchRecipients} from '../service/recipient';

const ViewRecipientsScreen = () => {
  const [recipients, setRecipients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const groupRecipientsByAlphabet = recipients => {
    return recipients.reduce((groups, recipient) => {
      const firstLetter = recipient.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(recipient);
      return groups;
    }, {});
  };

  const fetchAndGroupRecipients = async () => {
    setIsLoading(true);
    try {
      const result = await fetchRecipients();
      const groupedRecipients = groupRecipientsByAlphabet(result);
      setRecipients(groupedRecipients);
    } catch (error) {
      setError(`Error fetching recipients: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndGroupRecipients();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>View Recipients</Title>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Paragraph style={styles.error}>{error}</Paragraph>
      ) : Object.keys(recipients).length > 0 ? (
        Object.keys(recipients)
          .sort()
          .map((letter, index) => (
            <View key={index}>
              <Title>{letter}</Title>
              {recipients[letter].map((recipient, idx) => (
                <Paragraph key={idx}>
                  {recipient.name} - {recipient.wallet_address} -{' '}
                  {recipient.wallet_name}
                </Paragraph>
              ))}
            </View>
          ))
      ) : (
        <Paragraph>No recipients found.</Paragraph>
      )}
      <Button onPress={() => navigate(-1)}>Go Back</Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
});

export default ViewRecipientsScreen;
