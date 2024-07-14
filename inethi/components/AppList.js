import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import { getApps } from '../service/api.js'; // Ensure the path is correct

const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      let permissions;
      const sdkInt = Platform.Version; // Fetch the SDK version directly
      if (sdkInt >= 33) {
        permissions = [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        ];
      } else {
        permissions = [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ];
      }

      const granted = await PermissionsAndroid.requestMultiple(
        permissions,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to download files',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      console.log("Permission status:", granted);

      if (sdkInt >= 33) {
        const allPermissionsGranted = permissions.every(permission => granted[permission] === PermissionsAndroid.RESULTS.GRANTED);
        if (allPermissionsGranted) {
          console.log('You can use the media storage');
          return true;
        }
      } else {
        if (granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the storage');
          return true;
        }
      }

      if (granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to download files. Please enable it in the app settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
          { cancelable: false }
        );
        return false;
      } else {
        console.log('Storage permission denied');
        Alert.alert('Permission Denied', 'Storage permission is required to download files.');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export default function AppList() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const hasPermission = await requestStoragePermission();
      console.log("permission", hasPermission);
      if (hasPermission) {
        try {
          const data = await getApps();
          setApps(data);
        } catch (error) {
          console.error('Error fetching apps:', error);
        }
      }
    };

    fetchData();
  }, []);

  const createDownloadDirectory = async () => {
    const downloadDirectory = `${RNFS.DownloadDirectoryPath}/MyAppDownloads`;
    const exists = await RNFS.exists(downloadDirectory);
    if (!exists) {
      await RNFS.mkdir(downloadDirectory);
    }
    return downloadDirectory;
  };

  const downloadApp = async (url) => {
    try {
      const downloadDirectory = await createDownloadDirectory();
      const downloadDest = `${downloadDirectory}/${url.split('/').pop()}`;
      console.log("Download destination:", downloadDest);

      const response = await RNFS.downloadFile({
        fromUrl: `http://10.0.2.2:81${url}`,
        toFile: downloadDest,
      }).promise;

      if (response.statusCode === 200) {
        console.log('File downloaded to:', downloadDest);

        // Check if the file exists
        const fileExists = await RNFS.exists(downloadDest);
        if (fileExists) {
          console.log("file exists!!")
          Alert.alert(
            'Download Complete',
            'The Application has been downloaded successfully. Opening the Files app now...',
            [
              {
                text: 'Open Files',
                onPress: () => {
                  Linking.openURL('content://com.android.externalstorage.documents/root/primary');
                },
              },
              {
                text: 'OK',
                style: 'cancel',
              },
            ],
            { cancelable: true }
          );

        } else {
          console.error('File does not exist after download');
          Alert.alert('Error', 'File does not exist after download.');
        }
      } else {
        console.error('Failed to download file:', response.statusCode);
        Alert.alert('Error', 'Failed to download the file.');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'An error occurred while downloading the file.');
    }
  };

  const renderAppItem = ({ item }) => (
    <View style={styles.appItem}>
      <Image source={{ uri: `http://10.0.2.2:81${item.icon}` }} style={styles.icon} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => downloadApp(item.url)}
      >
        <Text style={styles.downloadButtonText}>Download</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={apps}
      renderItem={renderAppItem}
      keyExtractor={(item) => item.name}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  appItem: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
  },
  downloadButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  downloadButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});
