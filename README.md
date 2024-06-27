# iNethi App

## Prerequisites
Have keycloak and the management system running

### Keycloak Essentials
1. Make sure refresh tokes are enabled
2. Your user is granted offline access else you cannot use the refresh token
3. Your user has the 'create_wallet' role.

## Running the code
Make sure you have set your ANDROID_HOME environment variable before running. For example, on Linux:

```
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

To start the app run `npx react-native start`

