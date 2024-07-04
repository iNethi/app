import React from 'react';
import { Appbar } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import { useBalance } from '../context/BalanceContext';

const AppBarComponent = ({ logout }) => {
  const { balance } = useBalance();

  return (
      <Appbar.Header style={styles.appBar}>
        <View style={styles.content}>
          <View>
            <Text style={styles.text}>{balance}</Text>
          </View>
          <View>
            <Text style={styles.text}>Status: Online</Text>
          </View>
          <View>
            <Text style={styles.text}>Data: 1GB</Text>
            <Text style={styles.text}>Time: 12:00</Text>
          </View>
          <Appbar.Action icon="logout" onPress={logout} color="#FFFFFF" />
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
