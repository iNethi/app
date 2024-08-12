import React, { useState, useEffect } from 'react';
import { Animated, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-native';
import { Appbar, Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import MapboxGL from '@rnmapbox/maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Ping from 'react-native-ping';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getToken } from '../utils/tokenUtils';
import { vexo } from 'vexo-analytics';
import * as amplitude from '@amplitude/analytics-react-native';
import analytics from '@react-native-firebase/analytics';

vexo('2240fbec-f5f9-4010-98c8-2375bdaf4509');

MapboxGL.setAccessToken('sk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNseG56djZwdDA4cGoycnM2MjN2ZWxoNXIifQ.DVX2kNaurf_IJFPlZYE0zw');

const MapPage = () => {
    const navigate = useNavigate();
    const [selectedRouter, setSelectedRouter] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [routers, setRouters] = useState([]);
    const [isOffline, setIsOffline] = useState(false);
    const [circleSize] = useState(new Animated.Value(20));
    const [zoomLevel, setZoomLevel] = useState(14);
    const [centerCoordinate, setCenterCoordinate] = useState([18.3605, -34.1428]);

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
            const token = await getToken();
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
                            const response = await fetch('http://196.24.156.10:8000/monitoring/devices/', {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
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

    const handleMouseEnter = () => {
        Animated.timing(circleSize, {
            toValue: 30,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleMouseLeave = () => {
        Animated.timing(circleSize, {
            toValue: 20,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleMarkerPress = (router, coordinates) => {
        setSelectedRouter(router);
        setPopupPosition({ top: coordinates[1], left: coordinates[0] });

        const eventName = 'view_router_details';

        // Log event to Firebase Analytics
        analytics().logEvent(eventName, {
            router_name: router.name,
            router_ip: router.ipAddress
        }).then(() => {
            console.log(`Firebase Analytics event logged: ${eventName}`);
        }).catch((error) => {
            console.error(`Error logging event to Firebase Analytics: ${error}`);
        });

        // Log event to Amplitude
        amplitude.track(eventName, {
            router_name: router.name,
            router_ip: router.ipAddress
        });
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
                <Animated.View
                    style={[
                        styles.markerContainer,
                        {
                            width: circleSize,
                            height: circleSize,
                            borderRadius: circleSize.interpolate({
                                inputRange: [0, 100],
                                outputRange: [0, 50],
                            }),
                            backgroundColor: router.status === 'online' ? 'green' : 'red',
                        },
                    ]}
                />
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

    const handleZoomIn = () => {
        setZoomLevel((prevZoomLevel) => Math.min(prevZoomLevel + 1, 18));
    };

    const handleZoomOut = () => {
        setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 1, 10));
    };

    const onMapIdle = async () => {
        const center = await mapRef.current.getCenter();
        setCenterCoordinate(center);
    };

    const mapRef = React.useRef(null);

    useEffect(() => {
        const startTime = Date.now();

        return () => {
            const duration = Date.now() - startTime;

            const eventName = 'map_session_duration';

            // Log session duration to Firebase Analytics
            analytics().logEvent(eventName, {
                duration: duration
            }).then(() => {
                console.log(`Firebase Analytics event logged: ${eventName}`);
            }).catch((error) => {
                console.error(`Error logging event to Firebase Analytics: ${error}`);
            });

            // Log session duration to Amplitude
            amplitude.track(eventName, {
                duration: duration
            });
        };
    }, []);

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigate('/')} />
                <Appbar.Content title="Find Nearest Hotspot" titleStyle={styles.appbarTitle} />
            </Appbar.Header>
            <MapboxGL.MapView
                ref={mapRef}
                style={styles.map}
                zoomEnabled={true}
                scrollEnabled={true}
                styleURL={isOffline ? MapboxGL.StyleURL.Street : MapboxGL.StyleURL.Outdoors}
                onMapIdle={onMapIdle}
            >
                <MapboxGL.Camera
                    zoomLevel={zoomLevel}
                    centerCoordinate={centerCoordinate}
                    bounds={{
                        ne: [18.3685, -34.1278],
                        sw: [18.3485, -34.1478],
                    }}
                />
                {routers.map(renderRouterMarker)}
            </MapboxGL.MapView>
            {renderPopup()}
            <View style={styles.zoomControl}>
                <TouchableOpacity onPress={handleZoomIn} style={styles.zoomButton}>
                    <MaterialCommunityIcons name="plus" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleZoomOut} style={styles.zoomButton}>
                    <MaterialCommunityIcons name="minus" size={30} color="white" />
                </TouchableOpacity>
            </View>
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
    appbarTitle: {
        color: '#4285F4',
    },
    popupContainer: {
        position: 'absolute',
        width: '80%',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        zIndex: 1000,
    },
    zoomControl: {
        position: 'absolute',
        right: 10,
        bottom: 30,
        flexDirection: 'column',
    },
    zoomButton: {
        backgroundColor: '#4285F4',
        borderRadius: 50,
        padding: 10,
        marginBottom: 10,
    },
});

export default MapPage;
