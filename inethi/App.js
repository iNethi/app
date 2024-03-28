import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeRouter, Route, Routes } from 'react-router-native';
import { Provider as PaperProvider } from 'react-native-paper';
import HomePage from './pages/HomePage';
import AppBarComponent from './components/AppBarComponent';
import WebViewComponent from './components/WebViewComponent';

const App = () => (
  <PaperProvider>
    <SafeAreaProvider>
      <NativeRouter>
        <AppBarComponent />
        <Routes>
          <Route exact path="/" element={<HomePage/>} />
          <Route path="/webview" element={<WebViewComponent />}/> 
        </Routes>
      </NativeRouter>
    </SafeAreaProvider>
  </PaperProvider>
);

export default App;
