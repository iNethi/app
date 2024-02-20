import React from 'react';
import { Appbar } from 'react-native-paper';
import { View, Text } from 'react-native';

const AppBarComponent = () => (
    <Appbar.Header>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

        <View>
          <Text>Balance: 100 Units</Text>
        </View>
        <View>
          <Text>Status: Online</Text> 
        </View>
        <View>
          <Text>Data: 1GB</Text>
          <Text>Time: 12:00</Text>
        </View>
      </View>
    </Appbar.Header>
  );
  

export default AppBarComponent;
