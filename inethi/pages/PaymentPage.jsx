import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import { useNavigate } from 'react-router-native';

const PaymentPage = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('username'); // Default method
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('Loading...');

    useEffect(() => {
        // Placeholder for balance fetching logic
        const fetchBalance = async () => {
            const rpcUrl = 'https://forno.celo.org';
            const contractAddress = '0x8Bab657c88eb3c724486D113E650D2c659aa23d2';
            const walletAddress = '0xb89222b1B2fdE607e28B3c1C06BDA2696C3f0765';

            const data = {
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: contractAddress,
                    data: '0x70a08231000000000000000000000000' + walletAddress.substring(2)
                }, 'latest'],
                id: 1
            };

            try {
                const response = await fetch(rpcUrl, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                });
                const json = await response.json();
                console.log("API Response:", json); // Log the raw API response

                const balanceInWei = BigInt(json.result);
                console.log("Balance in Wei (BigInt):", balanceInWei.toString()); // Log the balance in wei as a BigInt

                // Adjust the division for token's decimal places (e.g., 6 for KRONE)
                const tokenDecimals = 6;
                const balanceInToken = balanceInWei / BigInt(10 ** tokenDecimals);
                console.log("Balance in KRONE:", balanceInToken.toString()); // Log the converted balance in KRONE
                setBalance(`${balanceInToken.toString()}`);
            } catch (err) {
                console.error('Error:', err);
                setBalance('Error fetching balance');
            }
        };

        fetchBalance();
    }, []);

    return (
        <View style={styles.container}>
            <Button
                title="Go Back"
                onPress={() => navigate(-1)}
                style={styles.backButton}
            >Go Back</Button>
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceText}>Your Balance: {balance} KRONE</Text>
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
                    onPress={() => console.log('Payment details:', { receiver, amount })}
                />
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
