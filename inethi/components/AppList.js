import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import { useNavigate } from 'react-router-native';
import { getApps } from '../service/api.js';
import * as Progress from 'react-native-progress'; // Import react-native-progress
import DeviceInfo from 'react-native-device-info'; // Import device info
import Metric from '../service/Metric.js';

const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      let permissions;
      const sdkInt = Platform.Version;
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
  const [installedApps, setInstalledApps] = useState({});
  const [downloadProgress, setDownloadProgress] = useState(0); // State for download progress
  const navigate = useNavigate();
  const [featureClicked, setFeatureClicked] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const hasPermission = await requestStoragePermission();
      console.log("permission", hasPermission);
      if (hasPermission) {
        try {
          console.log("feature before set:", featureClicked);
          setFeatureClicked("AppStore")

          const data = await getApps();
          console.log("data received:", data);
          setApps(data);
          checkInstalledApps(data);


        } catch (error) {
          console.error('Error fetching apps:', error);
        }
      }
    };

    fetchData();
  }, []);
  console.log("feature after set:", featureClicked);

  const checkInstalledApps = async (apps) => {
    const installedStatus = {};
    for (const app of apps) {
      const isInstalled = await DeviceInfo.isAppInstalled(app.packageName); // Use packageName to check if the app is installed
      installedStatus[app.packageName] = isInstalled;
    }
    setInstalledApps(installedStatus);
  };

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

      const downloadOptions = {
        fromUrl: `http://10.0.2.2:81${url}`,
        toFile: downloadDest,
        begin: (res) => {
          console.log('Download has begun', res);
        },
        progress: (res) => {
          if (res.bytesWritten && res.contentLength) {
            let progressPercent = (res.bytesWritten / res.contentLength) * 100;
            console.log(`Progress: ${progressPercent}%`);
            setDownloadProgress(progressPercent / 100); // Update progress for Progress.Bar
          } else {
            console.error('Progress update received invalid values', res);
          }
        },
      };

      const response = await RNFS.downloadFile(downloadOptions).promise;

      if (response.statusCode === 200) {
        console.log('File downloaded to:', downloadDest);

        const fileExists = await RNFS.exists(downloadDest);
        if (fileExists) {
          console.log("file exists!!")
          Alert.alert(
            'Download Complete',
            'The Application has been downloaded successfully. Opening the Files app now..',
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
          setDownloadProgress(0); // Reset progress after successful download
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
    <View style={styles.appItem} key={item.url}>
      <Image source={{ uri: `http://10.0.2.2:81${item.icon}` }} style={styles.icon} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      {installedApps[item.packageName] ? (
        <Text style={styles.installedText}>Installed</Text>
      ) : (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => downloadApp(item.url)}
        >
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      )}
      {downloadProgress > 0 && (
        <View style={styles.progressContainer}>
          <Progress.Bar
            progress={downloadProgress}
            width={200}
            color="#007BFF"
          />
          <Text>{Math.floor(downloadProgress * 100)}%</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigate('/')}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <FlatList
        data={apps}
        renderItem={renderAppItem}
        keyExtractor={(item) => item.url} // Use URL as a unique key
        contentContainerStyle={styles.listContainer}
      />
      <Metric feature={featureClicked} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
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
  installedText: {
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    margin: 10,
  },
  backButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
});
