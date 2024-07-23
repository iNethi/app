import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-native';
import { Appbar, Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import MapboxGL from '@rnmapbox/maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Ping from 'react-native-ping';

MapboxGL.setAccessToken('sk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNseG56djZwdDA4cGoycnM2MjN2ZWxoNXIifQ.DVX2kNaurf_IJFPlZYE0zw');

const MapPage = () => {
    const navigate = useNavigate();
    const [selectedRouter, setSelectedRouter] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [routers, setRouters] = useState([]);
    const [isOffline, setIsOffline] = useState(false);

    const pingNode = async (ip) => {
        try {
            const ms = await Ping.start(ip, { timeout: 1000 });
            return ms >= 0;
        } catch (error) {
            return false;
        }
    };

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
                        const internetCheck = await fetch('https://www.google.com', { method: 'HEAD' });
                        if (internetCheck.ok) {
                            console.log('Internet access confirmed, fetching data from API');
                            const response = await fetch('http://172.16.9.47:8000/monitoring/devices/', {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            const data = await response.json();
                            console.log('Fetched data from API:', data);
                            const formattedData = await Promise.all(data.map(async (item, index) => {
                                const status = await pingNode(item.ip) ? 'online' : 'offline';
                                return {
                                    id: index,
                                    coordinates: [item.lon, item.lat],
                                    ipAddress: item.ip,
                                    status,
                                    name: item.name,
                                    mac: item.mac,
                                };
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

    const handleMarkerPress = (router, coordinates) => {
        setSelectedRouter(router);
        setPopupPosition({ top: coordinates[1], left: coordinates[0] });
    };

    const renderRouterMarker = (router) => (
        <MapboxGL.PointAnnotation
            key={router.id}
            id={`router-${router.id}`}
            coordinate={router.coordinates}
            onSelected={() => handleMarkerPress(router, router.coordinates)}
        >
            <TouchableOpacity
                onPress={() => handleMarkerPress(router, router.coordinates)}
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
            <View style={[styles.popupContainer, { top: popupPosition.top, left: popupPosition.left }]}>
                <Portal>
                    <Dialog visible={!!selectedRouter} onDismiss={() => setSelectedRouter(null)}>
                        <Dialog.Title>Router Details</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>Name: {selectedRouter.name}</Paragraph>
                            <Paragraph>MAC Address: {selectedRouter.mac}</Paragraph>
                            <Paragraph>IP Address: {selectedRouter.ipAddress}</Paragraph>
                            <Paragraph>Status: {selectedRouter.status}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setSelectedRouter(null)}>Close</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigate('/')} />
                <Appbar.Content title="Find Nearest Hotspot" titleStyle={styles.appbarTitle} />
            </Appbar.Header>
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
                    centerCoordinate={[18.3605, -34.1428]} // Adjusted coordinates to focus more on Ocean View
                    bounds={{
                        ne: [18.3685, -34.1278],
                        sw: [18.3485, -34.1478],
                    }}
                />
                {routers.map(renderRouterMarker)}
            </MapboxGL.MapView>
            {renderPopup()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    appbarTitle: {
        color: '#4285F4', // Updated to match the blue shade used in the app
    },
    popupContainer: {
        position: 'absolute',
        width: '80%',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        zIndex: 1000,
    },
});

export default MapPage;
