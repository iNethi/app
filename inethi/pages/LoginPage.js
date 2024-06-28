
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, Text, TouchableOpacity } from 'react-native';
import axios from "axios";
import {useNavigate} from "react-router-native";

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            console.log('Error response:', err.response);
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log('Data:', err.response.data);
                console.log('Status:', err.response.status);
                console.log('Headers:', err.response.headers);
                setError(`Failed to login: ${err.response.data.error_description || err.response.data.error || 'Unknown error'}`);
            } else if (err.request) {
                // The request was made but no response was received
                console.log('Request:', err.request);
                setError('No response received from the server.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error Message:', err.message);
                setError('Failed to login: ' + err.message);
            }
        }
    };

    return (
        <View style={styles.container}>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Button title="Login" onPress={handleLogin} />

            {error ? <Text>{error}</Text> : null}
            <View style={styles.registerContainer}>
                <Text>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigate('/register')}>
                    <Text style={styles.registerText}>Register here</Text>
                </TouchableOpacity>
            </View>
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
    },
    registerContainer: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'center',
    },
    registerText: {
        textDecorationLine: 'underline',
        color: 'blue',
    }
});

export default LoginPage;
