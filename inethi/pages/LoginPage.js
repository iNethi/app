
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, Text } from 'react-native';
import axios from "axios";

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {

            const response = await axios.post('https://keycloak.inethicloud.net/realms/inethi-global-services/protocol/openid-connect/token ', `client_id=inethi-app&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password&scope=openid offline_access`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const { access_token, expires_in, refresh_token } = response.data;
            if (access_token && expires_in && refresh_token) {
                onLoginSuccess(access_token, expires_in, refresh_token); // Pass expires_in to App.js
            } else {
                setError('No access token received');
            }
        } catch (err) {
            console.log(err)
            setError('Failed to login: ' + err.message);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Button title="Login" onPress={handleLogin} />
            {error ? <Text>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        height: 40,
        marginBottom: 12,
        borderWidth: 1,
        padding: 10,
    }
});

export default LoginPage;
