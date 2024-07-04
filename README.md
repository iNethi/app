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

To start the app run `npm start`

### Registering a Phone on Linux to test:
1. Ensure debug mode is enabled on the phone
2. Install adb: `sudo apt install adb`
3. Ensure your user is in the plugdev group: `sudo usermod -aG plugdev $USER`
4. find the device `lsusb`
5. Add device to udev rules: `echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/51-android-usb.rules` where the device ID is "2717:ff08"
6. Check devices `adb devices`

## Building the Code for Release

### Not signed
Build a release version of the app to transfer to a device for testing
1. Create the Assets Directory `mkdir -p android/app/src/main/assets`
2. Bundle the JavaScript `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/`
3. Build the Release APK: (from root dir)
```
cd android
./gradlew assembleRelease
```
4. Install it on connected device (if you have one): `adb install -r android/app/build/outputs/apk/release/app-release.apk` (from root dir) else for two `adb -s AIRKXG7TAMNZWKIB install -r android/app/build/outputs/apk/release/app-release.apk` where 'AIRKXG7TAMNZWKIB' is the device ID (check with `adb devices`)
