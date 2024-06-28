import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, Text, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigate } from 'react-router-native';

const RegisterPage = ({ onRegisterSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post('https://manage-backend.inethilocal.net/user/keycloak/register/', {
                username: username,
                password: password,
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201) {
                onRegisterSuccess();
                navigate('/');
            } else {
                setError('Failed to register');
            }
        } catch (err) {
            console.log(err);
            setError('Failed to register: ' + err.message);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                    style={styles.showPasswordButton}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Text>{showPassword ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
            </View>
            <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                secureTextEntry={!showPassword}
            />
            <Button title="Register" onPress={handleRegister} />
            <TouchableOpacity onPress={() => navigate('/login')}>
                <Text style={styles.loginLink}>Already have an account? Login here</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    showPasswordButton: {
        marginLeft: 10,
    },
    loginLink: {
        marginTop: 20,
        textAlign: 'center',
        color: 'blue',
        textDecorationLine: 'underline',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    }
});

export default RegisterPage;
