import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Button,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import {useNavigate} from 'react-router-native';
import {handleLogin} from '../utils/utils';
import {Dialog} from 'react-native-paper';

const RegisterPage = ({onRegisterSuccess, onLoginSuccess}) => {
  const baseURL = 'http://localhost:8000';
  //const baseURL = 'https://manage-backend.inethicloud.net';
  const registerEndpoint = '/user/keycloak/register/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);

    try {
      const response = await axios.post(
        `${baseURL}${registerEndpoint}`,
        {
          username: username,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 201) {
        onRegisterSuccess();
        await handleLogin(
          username,
          password,
          onLoginSuccess,
          setError,
          setLoading,
          navigate,
        );
      } else {
        setError('Failed to register');
      }
    } catch (error) {
      console.log(error);
      setError('Failed to register: ' + error.message);
      if (error.response) {
        if (error.response.status === 409) {
          Alert.alert(
            'Error',
            'User name is already in use. Please login or try a new user name.',
          );
        } else if (error.response.status === 500) {
          Alert.alert('Error', 'Error, please contact iNethi support.');
        } else {
          Alert.alert('Error', `Failed to register: ${error.message}`);
        }
      } else {
        Alert.alert('Error', `Failed to register: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password && username && confirmPassword) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [password, password, confirmPassword]);

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
          onPress={() => setShowPassword(!showPassword)}>
          <Text>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm Password"
        secureTextEntry={!showPassword}
      />

      <Button
        title="Register"
        onPress={handleRegister}
        disabled={isButtonDisabled}
      />
      {loading && (
        <Dialog visible={true}>
          <Dialog.Content>
            <ActivityIndicator size="large" />
          </Dialog.Content>
        </Dialog>
      )}
      <TouchableOpacity onPress={() => navigate('/login')}>
        <Text style={styles.loginLink}>
          Already have an account? Login here
        </Text>
      </TouchableOpacity>
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
  },
});

export default RegisterPage;
