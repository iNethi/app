import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Card, Title } from 'react-native-paper';
import { useNavigate } from 'react-router-native';
import { Linking } from 'react-native';
import UploadModal from '../components/UploadModal';

const HomePage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState({
      Wallet: [
        { name: "Generate", action: () => Linking.openURL('https://sarafu.network') },
        { name: "Connect Wallet", action: () => setIsModalVisible(true) },
      ],
    });
    const [isModalVisible, setIsModalVisible] = useState(false);

// Handling success and error from upload
const handleUploadSuccess = (result) => {
  console.log('Upload success:', result);
  setIsModalVisible(false);
};

const handleUploadError = (error) => {
  console.error('Upload failed:', error);
};


  useEffect(() => {
    const fetchButtonData = async () => {

      const apiResponse = {
        Utility: [
          { name: "Splash", url: "https://splash.inethicloud.net" },
          { name: "Nextcloud", url: "https://nextcloud.inethicloud.net" },
          { name: "Vouchers", url: "https://vouchers.inethicloud.net" },
        ],
        Education: [
          { name: "Wikipedia", url: "https://wikipedia.org" },
          { name: "Khan Academy", url: "https://khanacademy.org" },
        ],
        Entertainment: [
          { name: "Video", url: "https://jellyfin.inethicloud.net" },
        ],
      };
      // Merge the API response with the existing state
    setCategories((prevState) => {
      // Create a new object to avoid direct mutation of state
      const newState = { ...prevState };

      Object.keys(apiResponse).forEach((category) => {
        // If the category already exists, append the new items to it
        if (newState[category]) {
          newState[category] = [...newState[category], ...apiResponse[category]];
        } else {
          // Otherwise, just add the new category from the API response
          newState[category] = apiResponse[category];
        }
      });

      return newState;
    });
  };

    fetchButtonData();
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
