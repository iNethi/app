// pages/ViewRecipients.js
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Title, Paragraph, ActivityIndicator, Button} from 'react-native-paper';
import {fetchRecipients} from '../api/recipientApi';
import {useNavigate} from 'react-router-native';

const ViewRecipients = () => {
  const [recipients, setRecipients] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndGroupRecipients = async () => {
      try {
        const result = await fetchRecipients();
        const groupedRecipients = groupRecipientsByAlphabet(result);
        setRecipients(groupedRecipients);
      } catch (error) {
        alert(`Error fetching recipients: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndGroupRecipients();
  }, []);

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

  return (
    <ScrollView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : Object.keys(recipients).length > 0 ? (
        Object.keys(recipients)
          .sort()
          .map((letter, index) => (
            <View key={index} style={styles.alphabetGroup}>
              <Title style={styles.alphabetTitle}>{letter}</Title>
              {recipients[letter].map((recipient, idx) => (
                <Paragraph key={idx} style={styles.recipientItem}>
                  {recipient.name} - {recipient.wallet_address} -{' '}
                  {recipient.wallet_name}
                </Paragraph>
              ))}
            </View>
          ))
      ) : (
        <Paragraph>No recipients found.</Paragraph>
      )}
      <Button onPress={() => navigate('/')} style={styles.backButton}>
        Back to Home
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  alphabetGroup: {
    marginTop: 10,
    marginBottom: 10,
  },
  alphabetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  recipientItem: {
    marginBottom: 5,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#4285F4',
  },
});

export default ViewRecipients;
