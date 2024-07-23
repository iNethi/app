import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const NewModalNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const checkConnection = async () => {
            const state = await NetInfo.fetch();
            if (state.isConnected) {
                try {
                    const response = await fetch('https://www.google.com');
                    if (response.ok) {
                        setIsConnected(true);
                    } else {
                        setIsConnected(false);
                        showAlert();
                    }
                } catch (error) {
                    setIsConnected(false);
                    showAlert();
                }
            } else {
                setIsConnected(false);
                showAlert();
            }
        };

        checkConnection();

        const unsubscribe = NetInfo.addEventListener(async (state) => {
            if (state.isConnected) {
                try {
                    const response = await fetch('https://www.google.com');
                    if (response.ok) {
                        setIsConnected(true);
                    } else {
                        setIsConnected(false);
                        showAlert();
                    }
                } catch (error) {
                    setIsConnected(false);
                    showAlert();
                }
            } else {
                setIsConnected(false);
                showAlert();
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const showAlert = () => {
        Alert.alert(
            'Internet Connection',
            'You are offline. Some features may not be available.',
            [{ text: 'OK' }]
        );
    };

    return (
        <View style={styles.container}>
            {isConnected ? <Text style={styles.onlineText}>Online</Text> : <Text style={styles.offlineText}>Offline</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        width: '100%',
        padding: 10,
        backgroundColor: '#ffcccb',
        zIndex: 1,
        alignItems: 'center',
    },
    onlineText: {
        color: 'green',
        fontWeight: 'bold',
    },
    offlineText: {
        color: 'red',
        fontWeight: 'bold',
    },
});

export default NewModalNetworkStatus;