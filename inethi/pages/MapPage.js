import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('sk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNseG56djZwdDA4cGoycnM2MjN2ZWxoNXIifQ.DVX2kNaurf_IJFPlZYE0zw');

const MapPage = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Hello World</Text>
            <View style={styles.mapcontainer}>
                <MapboxGL.MapView style={styles.map} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    mapcontainer: {
        height: 300,
        width: 300,
    },
    map: {
        flex: 1,
    },
});

export default MapPage;
