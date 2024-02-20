import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const HomePage = () => {
  const [buttonNames, setButtonNames] = useState([]);

  useEffect(() => {
    const fetchButtonNames = async () => {
      const names = ["Splash", "Video", "Wikipedia", "Nextcloud", "Khan Academy", "Vouchers"];
      setButtonNames(names);
    };

    fetchButtonNames();
  }, []);

  const chunkedButtonNames = (names, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < names.length; i += chunkSize) {
      chunks.push(names.slice(i, i + chunkSize));
    }
    return chunks;
  };


  return (
    <View style={styles.container}>
      {chunkedButtonNames(buttonNames, 2).map((chunk, index) => (
        <View key={index} style={styles.buttonRow}>
          {chunk.map((name, idx) => (
            <Button key={idx} mode="contained" onPress={() => console.log('Pressed', name)} style={styles.button} labelStyle={styles.buttonLabel}>
              {name}
            </Button>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      margin: 3,
    },
    button: {
      marginHorizontal: 4,
      flex: 1, // fill the row evenly
    },
    buttonLabel: {
        fontSize: 12,
      },
  });

export default HomePage;
