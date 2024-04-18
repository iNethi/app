import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeRouter, Route, Routes } from 'react-router-native';
import { Provider as PaperProvider } from 'react-native-paper';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AppBarComponent from './components/AppBarComponent';
import WebViewComponent from './components/WebViewComponent';
import PaymentPage from "./pages/PaymentPage";

const App = () => {
    const [userToken, setUserToken] = useState(null);

    useEffect(() => {
        const loadToken = async () => {
            const token = await AsyncStorage.getItem('userToken');
            setUserToken(token);
        };
        loadToken();
    }, []);
    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('tokenExpiry');
        await AsyncStorage.removeItem('refreshToken');
        setUserToken(null);  // This will trigger a re-render and redirect to the login page
    };

    const handleLoginSuccess = async (token, expiresIn, refresh_token) => {
        const expiryDate = new Date().getTime() + expiresIn * 1000;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('tokenExpiry', expiryDate.toString());  // Store the expiry time
        await AsyncStorage.setItem('refreshToken', refresh_token);
        setUserToken(token);
    };


    return (
        <PaperProvider>
            <SafeAreaProvider>
                <NativeRouter>
                    <AppBarComponent logout={logout} />
                    <Routes>
                        {userToken ? (
                            <>
                                <Route exact path="/" element={<HomePage logout={logout}/>} />
                                <Route path="/payment" element={<PaymentPage />}/>
                                <Route path="/webview" element={<WebViewComponent />}/>
                            </>
                        ) : (
                            <Route path="*" element={<LoginPage onLoginSuccess={handleLoginSuccess}/>} />
                        )}
                    </Routes>
                </NativeRouter>
            </SafeAreaProvider>
        </PaperProvider>
    );
};

export default App;