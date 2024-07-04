import axios from 'axios';

export const handleLogin = async (username, password, onLoginSuccess, setError, setLoading, navigate) => {
    setLoading(true);
    try {
        const response = await axios.post('https://keycloak.inethicloud.net/realms/inethi-global-services/protocol/openid-connect/token', `client_id=inethi-app&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password&scope=openid offline_access`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const { access_token, expires_in, refresh_token } = response.data;
        if (access_token && expires_in && refresh_token) {
            onLoginSuccess(access_token, expires_in, refresh_token); // Pass expires_in to App.js
            navigate('/');
        } else {
            setError('No access token received');
        }
    } catch (err) {
        console.log('Error response:', err.response);
        if (err.response) {
            console.log('Data:', err.response.data);
            console.log('Status:', err.response.status);
            console.log('Headers:', err.response.headers);
            setError(`Failed to login: ${err.response.data.error_description || err.response.data.error || 'Unknown error'}`);
        } else if (err.request) {
            console.log('Request:', err.request);
            setError('No response received from the server.');
        } else {
            console.log('Error Message:', err.message);
            setError('Failed to login: ' + err.message);
        }
    }
    finally {
        setLoading(false);
    }
};
