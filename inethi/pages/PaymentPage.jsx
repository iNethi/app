import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigate } from 'react-router-native';
import axios from "axios";
import { Dialog } from "react-native-paper";
import { getToken } from '../utils/tokenUtils';
import { useBalance } from '../context/BalanceContext';

const PaymentPage = () => {
    const baseURL = 'https://manage-backend.inethicloud.net';
    const walletSendEndpoint = '/wallet/send-token/';
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('username'); // Default method
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const { balance, fetchBalance } = useBalance(); // Destructure balance and fetchBalance
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

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

            const response = await axios.post(`${baseURL}${walletSendEndpoint}`, paymentData, config);

            setIsLoading(false);
            Alert.alert('Success', 'Payment sent successfully');
            fetchBalance(); // Refresh balance after payment
        } catch (error) {
            setIsLoading(false);
            console.error('Error sending payment:', error);
            if (error.response) {
                if (error.response.status === 401) {
                    Alert.alert('Error', 'Authentication credentials were not provided.');
                } else if (error.response.status === 404) {
                    Alert.alert('Error', 'Cannot find user.');
                } else if (error.response.status === 406) {
                    Alert.alert('Error', 'Recipient does not have a wallet on the iNethi system.');
                } else if (error.response.status === 412) {
                    Alert.alert('Error', 'Insufficient funds.');
                } else if (error.response.status === 417) {
                    Alert.alert('Error', 'You do not have a wallet. Please create one.');
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
        fetchBalance(); // Fetch balance when the page loads
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
            <Button
                title="Go Back"
                onPress={() => navigate(-1)}
                style={styles.backButton}
            >Go Back</Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
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
        marginBottom: 20,
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
        marginVertical: 10,
    },
    balanceText: {
        fontSize: 18,
        fontWeight: '500',
    },
    sendButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: '#A0A0A0',
    },
    backButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default PaymentPage;
