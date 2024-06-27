import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import { useNavigate } from 'react-router-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {Dialog} from "react-native-paper";

const PaymentPage = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('username'); // Default method
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('Loading...');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const getToken = async () => {
        let token = await AsyncStorage.getItem('userToken');
        if (!token) {
            setError('Authentication token not found');

            return null;
        }

        if (await isTokenExpired()) {
            try {
                token = await getNewToken();
            } catch (refreshError) {
                setError('Failed to refresh token: ' + refreshError.message);
                return null;
            }
        }

        return token;
    };
    const storeToken = async (token, expiresIn) => {
        const expiryDate = new Date().getTime() + expiresIn * 1000;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('tokenExpiry', expiryDate.toString());
    };
    const isTokenExpired = async () => {
        const expiryDate = await AsyncStorage.getItem('tokenExpiry');
        return new Date().getTime() > parseInt(expiryDate);
    };

    const getNewToken = async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error("No refresh token available");

            const response = await axios.post('https://keycloak.inethicloud.net/realms/inethi-global-services/protocol/openid-connect/token', {
                client_id: 'inethi-app',
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token, expires_in, refresh_token: newRefreshToken } = response.data;
            await storeToken(access_token, expires_in);
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            console.log(`New token ${access_token}`)
            return access_token;
        } catch (error) {
            if (error.response) {
                console.error('Refresh Token Error:', error.response.data);
                if (error.response.data.error === 'invalid_grant') {
                    console.error('The refresh token is invalid or expired.');
                    logout();
                }
            } else {
                console.error('Refresh Token Error:', error.message);
            }
            throw new Error('Failed to refresh token');
        }
    };

    const handleSendPayment = async () => {
        if (!receiver || !amount) {
            setError('Both fields are required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const token = await getToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const paymentData = {
                payment_method: paymentMethod,
                recipient_alias: paymentMethod === 'username' ? receiver : undefined,
                recipient_address: paymentMethod === 'walletAddress' ? receiver : undefined,
                amount,
            };

            const response = await axios.post('https://manage-backend.inethilocal.net/wallet/send-token/', paymentData, config);

            setIsLoading(false);
            Alert.alert('Success', 'Payment sent successfully');
        } catch (error) {
            setIsLoading(false);
            console.error('Error sending payment:', error);
            if (error.response) {
                if (error.response.status === 401) {
                    Alert.alert('Error', 'Authentication credentials were not provided.');
                } else if (error.response.status === 404) {
                    Alert.alert('Error', 'Cannot find user.');
                } else if (error.response.status === 412) {
                    Alert.alert('Error', 'Insufficient funds.');
                } else if (error.response.status === 500) {
                    Alert.alert('Error', 'Error sending payment. Check payment details and you gas status alternatively contact iNethi support.');
                } else {
                    Alert.alert('Error', `Failed to send payment: ${error.message}`);
                }
            } else {
                Alert.alert('Error', `Failed to send payment: ${error.message}`);
            }
        }
    };

    useEffect(() => {
        const fetchBalance = async () => {
            setIsLoading(true);
            try {
                const token = await getToken();
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                };

                const response = await axios.get('https://manage-backend.inethilocal.net/wallet/balance/', config);
                setIsLoading(false);
                setBalance(response.data.balance);
            } catch (error) {
                setIsLoading(false);
                console.error('Error checking balance:', error);
                if (error.response) {
                    if (error.response.status === 401) {
                        alert('Authentication credentials were not provided.');
                    } else if (error.response.status === 400) {
                        alert('User does not exist.');
                    } else if (error.response.status === 500) {
                        alert('Error checking balance. Please contact iNethi support.');
                    } else {
                        alert(`Failed to check balance: ${error.message}`);
                    }
                } else {
                    alert(`Failed to check balance: ${error.message}`);
                }
            }
        };

        fetchBalance();
    }, []);

    useEffect(() => {
        if (receiver && amount) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [receiver, amount]);

    return (
        <View style={styles.container}>
            <Button
                title="Go Back"
                onPress={() => navigate(-1)}
                style={styles.backButton}
            >Go Back</Button>
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceText}>Your Balance: {balance}</Text>
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.title}>Make a Payment</Text>
                <Picker
                    selectedValue={paymentMethod}
                    style={styles.picker}
                    onValueChange={(itemValue) => setPaymentMethod(itemValue)}
                >
                    <Picker.Item label="Username" value="username" />
                    <Picker.Item label="Wallet Address" value="walletAddress" />
                </Picker>
                <TextInput
                    style={styles.input}
                    onChangeText={setReceiver}
                    value={receiver}
                    placeholder={paymentMethod === 'username' ? 'Username of receiver' : 'Wallet address'}
                />
                <TextInput
                    style={styles.input}
                    onChangeText={setAmount}
                    value={amount}
                    placeholder="Amount"
                    keyboardType="numeric"
                />
                <Button
                    title="Send Payment"
                    onPress={handleSendPayment}
                    disabled={isButtonDisabled}
                />
                {isLoading && (
                    <Dialog visible={true}>
                        <Dialog.Content>
                            <ActivityIndicator size="large" />
                        </Dialog.Content>
                    </Dialog>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formContainer: {
        padding: 20,
        width: '80%',
        maxWidth: 300,
        backgroundColor: 'white',
        borderRadius: 10,
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        height: 40,
        marginBottom: 12,
        borderWidth: 1,
        padding: 10,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    balanceContainer: {
        marginVertical: 10, // Adjust as needed for spacing
    },
    balanceText: {
        fontSize: 18,
        fontWeight: '500',
    },
    backButton: {
        backgroundColor: '#4285F4',
    },
});

export default PaymentPage;
