import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Title } from 'react-native-paper';
import { useNavigate } from 'react-router-native';

const HomePage = () => {
    const navigate = useNavigate();
  const [categories, setCategories] = useState({
    Utility: [],
    Education: [],
    Entertainment: [],
  });


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
      setCategories(apiResponse);
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
          {pair.map(({ name, url }, idx) => (
            <Button key={idx} mode="contained" onPress={() => openURL(url)} style={styles.button}>
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
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default HomePage;
