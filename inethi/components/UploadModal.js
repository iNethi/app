import React, { useState } from 'react';
import { Modal, Portal, Button, Text } from 'react-native-paper';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import { StyleSheet, View } from 'react-native';

const UploadModal = ({ isVisible, onDismiss, onSuccess, onError }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async () => {
    try {
      const file = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      });
      
      setIsUploading(true);
      let apiUrl = 'https://yourapi.com/upload';
      RNFetchBlob.fetch('POST', apiUrl, {
        'Content-Type': 'multipart/form-data',
      }, [
        { name: 'walletImage', filename: file.name, type: file.type, data: RNFetchBlob.wrap(file.uri) },
      ]).then(response => response.json())
        .then(result => {
          onSuccess(result);
          setIsUploading(false);
        })
        .catch(error => {
          console.error(error);
          onError(error);
          setIsUploading(false);
        });
    } catch (err) {
      setIsUploading(false);
      if (DocumentPicker.isCancel(err)) {
        // User canceled the picker
        console.log('User canceled the file picker');
      } else {
        throw err;
      }
    }
  };

  return (
    <Portal>
      <Modal visible={isVisible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text>Upload your wallet PNG</Text>
        <Button disabled={isUploading} onPress={handleFileUpload}>
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
  },
});

export default UploadModal;
