import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

MapboxGL.setAccessToken('sk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNseG56djZwdDA4cGoycnM2MjN2ZWxoNXIifQ.DVX2kNaurf_IJFPlZYE0zw');

const MapPage = () => {
    const [selectedRouter, setSelectedRouter] = useState(null);
    const [routers, setRouters] = useState([]);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cachedData = await AsyncStorage.getItem('routerData');
                if (cachedData) {
                    console.log('Using local stored data');
                    setRouters(JSON.parse(cachedData));
                } else {
                    console.log('No local data found, fetching from API');
                }

                const state = await NetInfo.fetch();
                if (state.isConnected && state.type === 'wifi') {
                    console.log('Connected to Wi-Fi, checking internet access');
                    try {
                        // Check internet access by making a request to a reliable URL
                        const internetCheck = await fetch('https://www.google.com', { method: 'HEAD' });
                        if (internetCheck.ok) {
                            console.log('Internet access confirmed, fetching data from API');
                            const response = await fetch('http://172.16.7.31:8000/monitoring/devices/');
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            const data = await response.json();
                            const formattedData = data.map((item, index) => ({
                                id: index,
                                coordinates: [item.lon, item.lat],
                                ipAddress: item.ip,
                                status: item.status,
                                name: item.name,
                                mac: item.mac,
                            }));
                            setRouters(formattedData);
                            await AsyncStorage.setItem('routerData', JSON.stringify(formattedData));
                            console.log('Data fetched from API and saved to local storage');
                        } else {
                            console.log('No internet access, using cached data if available');
                        }
                    } catch (error) {
                        console.error('Error checking internet access or fetching router data from API:', error);
                    }
                } else {
                    console.log('Not connected to Wi-Fi, using cached data if available');
                }

                setIsOffline(!(state.isConnected && state.type === 'wifi'));
            } catch (error) {
                console.error('Error fetching router data:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const downloadMapRegion = async () => {
            if (!isOffline) {
                const bounds = [
                    [18.3685, -34.1278], // NE
                    [18.3485, -34.1478]  // SW
                ];

                const offlineRegion = {
                    name: 'offlinePack',
                    styleURL: MapboxGL.StyleURL.Street,
                    minZoom: 10,
                    maxZoom: 18,
                    bounds
                };

                const progressListener = (offlineRegion, status) => {
                    console.log(`Download progress: ${status.percentage}%`, offlineRegion);
                };
                const errorListener = (offlineRegion, err) => {
                    console.error('Error downloading offline pack:', err, offlineRegion);
                };

                try {
                    const packs = await MapboxGL.offlineManager.getPacks();
                    const existingPack = packs.find(pack => pack.name === 'offlinePack');
                    if (existingPack) {
                        console.log('Offline pack already exists. Using existing pack.');
                    } else {
                        await MapboxGL.offlineManager.createPack(offlineRegion, progressListener, errorListener);
                        console.log('Created new offline pack.');
                    }
                } catch (error) {
                    console.error('Error creating offline pack:', error);
                }
            }
        };

        downloadMapRegion();
    }, [isOffline]);

    const [innerCircleSize] = useState(new Animated.Value(10));
    const [outerCircleSize] = useState(new Animated.Value(20));

    const handleMouseEnter = () => {
        Animated.timing(outerCircleSize, {
            toValue: 30,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleMouseLeave = () => {
        Animated.timing(outerCircleSize, {
            toValue: 20,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const renderRouterMarker = (router) => (
        <MapboxGL.PointAnnotation
            key={router.id}
            id={`router-${router.id}`}
            coordinate={router.coordinates}
            onSelected={() => setSelectedRouter(router)}
        >
            <TouchableOpacity
                onPress={() => setSelectedRouter(router)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <View style={styles.markerContainer}>
                    <Animated.View
                        style={[
                            styles.outerCircle,
                            {
                                width: outerCircleSize,
                                height: outerCircleSize,
                                borderRadius: outerCircleSize.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: [0, 50],
                                }),
                            },
                        ]}
                    />
                    <View style={styles.innerCircle} />
                </View>
            </TouchableOpacity>
        </MapboxGL.PointAnnotation>
    );

    const renderPopup = () => {
        if (!selectedRouter) return null;
        return (
            <TouchableWithoutFeedback onPress={() => setSelectedRouter(null)}>
                <View style={styles.popupContainer}>
                    <Animated.View style={styles.popup}>
                        <Text style={styles.popupText}>Name: {selectedRouter.name}</Text>
                        <Text style={styles.popupText}>MAC Address: {selectedRouter.mac}</Text>
                        <Text style={styles.popupText}>IP Address: {selectedRouter.ipAddress}</Text>
                        <Text style={styles.popupText}>Status: {selectedRouter.status}</Text>
                        <TouchableOpacity onPress={() => setSelectedRouter(null)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.mapcontainer}>
                <MapboxGL.MapView
                    style={styles.map}
                    zoomEnabled={true}
                    scrollEnabled={true}
                    styleURL={isOffline ? MapboxGL.StyleURL.Street : MapboxGL.StyleURL.Outdoors}
                    onWillStartLoadingMap={() => {
                        console.log(isOffline ? 'Using offline Mapbox' : 'Using online Mapbox');
                    }}
                >
                    <MapboxGL.Camera
                        zoomLevel={14}
                        centerCoordinate={[18.3585, -34.1378]}
                        bounds={{
                            ne: [18.3685, -34.1278],
                            sw: [18.3485, -34.1478],
                        }}
                    />
                    {routers.map(renderRouterMarker)}
                </MapboxGL.MapView>
                {renderPopup()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapcontainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'black',
    },
    outerCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    popupContainer: {
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '80%',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
    },
    popup: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 5,
        borderColor: 'black',
        borderWidth: 1,
    },
    popupText: {
        fontSize: 16,
        marginBottom: 5,
    },
    closeButton: {
        marginTop: 10,
        padding: 5,
        backgroundColor: 'black',
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 14,
    },
});

export default MapPage;