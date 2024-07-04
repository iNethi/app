
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TextInput, Button, Text, TouchableOpacity, ActivityIndicator, Alert,} from 'react-native';
import axios from "axios";
import {useNavigate} from "react-router-native";
import {handleLogin} from "../utils/utils";
import {Dialog} from "react-native-paper";

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    useEffect(() => {
        if (password && username) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [password, password]);
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
        }
    }, [error]);
    return (
        <View style={styles.container}>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Button title="Login"
                    disabled={isButtonDisabled}
                    onPress={() => handleLogin(username, password, onLoginSuccess, setError, setLoading, navigate)} />

            <View style={styles.registerContainer}>
                <Text>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigate('/register')}>
                    <Text style={styles.registerText}>Register here</Text>
                </TouchableOpacity>
            </View>
            {loading && (
                <Dialog visible={true}>
                    <Dialog.Content>
                        <ActivityIndicator size="large" />
                    </Dialog.Content>
                </Dialog>
            )}
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
