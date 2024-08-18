import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
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
import MapboxDirectionsFactory from '@mapbox/mapbox-sdk/services/directions';
import { lineString as makeLineString } from '@turf/helpers';

vexo('2240fbec-f5f9-4010-98c8-2375bdaf4509');

MapboxGL.setAccessToken('sk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNseG56djZwdDA4cGoycnM2MjN2ZWxoNXIifQ.DVX2kNaurf_IJFPlZYE0zw');

const directionsClient = MapboxDirectionsFactory({
    accessToken: 'sk.eyJ1IjoicG1hbWJhbWJvIiwiYSI6ImNseG56djZwdDA4cGoycnM2MjN2ZWxoNXIifQ.DVX2kNaurf_IJFPlZYE0zw',
});

const MapPage = () => {
    const navigate = useNavigate();
    const [selectedRouter, setSelectedRouter] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [routers, setRouters] = useState([]);
    const [isOffline, setIsOffline] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(14);
    const [centerCoordinate, setCenterCoordinate] = useState([18.3605, -34.1428]);
    const [pinLocation, setPinLocation] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [route, setRoute] = useState(null);
    const [distanceToNode, setDistanceToNode] = useState(null);
    const mapRef = useRef(null);

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
        if (pinLocation && routers.length > 0) {
            const nearestRouter = findNearestRouter();
            if (nearestRouter) {
                fetchDirections(pinLocation, nearestRouter.coordinates);
            }
        }
    }, [pinLocation, routers]);

    const findNearestRouter = () => {
        const onlineRouters = routers.filter(router => router.status === 'online');
        if (onlineRouters.length === 0) return null;

        let nearestRouter = onlineRouters[0];
        let minDistance = calculateDistance(pinLocation, nearestRouter.coordinates);

        onlineRouters.forEach(router => {
            const distance = calculateDistance(pinLocation, router.coordinates);
            if (distance < minDistance) {
                nearestRouter = router;
                minDistance = distance;
            }
        });

        return nearestRouter;
    };

    const calculateDistance = (coord1, coord2) => {
        const [lon1, lat1] = coord1;
        const [lon2, lat2] = coord2;

        const toRad = (x) => (x * Math.PI) / 180;
        const R = 6371;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const fetchDirections = async (startCoordinates, endCoordinates) => {
        const request = {
            waypoints: [
                { coordinates: startCoordinates },
                { coordinates: endCoordinates },
            ],
            profile: 'walking',
            geometries: 'geojson',
        };

        try {
            const response = await directionsClient.getDirections(request).send();
            const route = makeLineString(response.body.routes[0].geometry.coordinates);
            setRoute(route);

            // Calculate the distance and update the state
            const distance = calculateDistance(startCoordinates, endCoordinates);
            setDistanceToNode(distance);
        } catch (error) {
            console.error('Error fetching directions: ', error);
        }
    };

    const handleMarkerPress = (router, coordinates) => {
        setSelectedRouter(router);
        setPopupPosition({ top: coordinates[1], left: coordinates[0] });

        const eventName = 'view_router_details';

        analytics().logEvent(eventName, {
            router_name: router.name,
            router_ip: router.ipAddress
        }).then(() => {
            console.log(`Firebase Analytics event logged: ${eventName}`);
        }).catch((error) => {
            console.error(`Error logging event to Firebase Analytics: ${error}`);
        });

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
            <TouchableOpacity onPress={() => handleMarkerPress(router, router.coordinates)}>
                <MaterialCommunityIcons
                    name={router.status === 'online' ? 'wifi' : 'wifi-off'}
                    size={30}
                    color={router.status === 'online' ? 'green' : 'red'}
                />
            </TouchableOpacity>
        </MapboxGL.PointAnnotation>
    );

    const renderPinnedMarker = () => (
        pinLocation && (
            <MapboxGL.PointAnnotation
                id="pinned-location"
                coordinate={pinLocation}
                draggable
                onDragStart={() => setDragging(true)}
                onDragEnd={handleDragEnd}
            >
                <View style={styles.pinnedMarker}>
                    <Image
                        source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/standing-man.png' }}
                        style={styles.pinImage}
                    />
                </View>
            </MapboxGL.PointAnnotation>
        )
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

    const renderRoute = () => {
        return route ? (
            <MapboxGL.ShapeSource id="routeSource" shape={route}>
                <MapboxGL.LineLayer
                    id="routeFill"
                    style={{
                        lineColor: "#ff8109",
                        lineWidth: 3.2,
                        lineCap: MapboxGL.LineJoin.Round,
                        lineOpacity: 1.84
                    }}
                />
            </MapboxGL.ShapeSource>
        ) : null;
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

    const handleDragEnd = (e) => {
        const { geometry } = e;
        setPinLocation(geometry.coordinates);
        setDragging(false);
    };

    const handleMapPress = (e) => {
        if (dragging) return; // Prevent placing pin while dragging
        const { geometry } = e;
        setPinLocation(geometry.coordinates);
    };

    useEffect(() => {
        const startTime = Date.now();

        return () => {
            const duration = Date.now() - startTime;

            const eventName = 'map_session_duration';

            analytics().logEvent(eventName, {
                duration: duration
            }).then(() => {
                console.log(`Firebase Analytics event logged: ${eventName}`);
            }).catch((error) => {
                console.error(`Error logging event to Firebase Analytics: ${error}`);
            });

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
                onPress={handleMapPress}
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
                {renderPinnedMarker()}
                {renderRoute()}
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
            {!pinLocation && (
                <View style={styles.floatingPinContainer}>
                    <TouchableOpacity
                        style={styles.floatingPin}
                        onPress={() => setPinLocation(centerCoordinate)}
                    >
                        <Image
                            source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/standing-man.png' }}
                            style={styles.pinImage}
                        />
                    </TouchableOpacity>
                </View>
            )}
            {distanceToNode !== null && (
                <View style={styles.distanceContainer}>
                    <Text style={styles.distanceText}>
                        {distanceToNode >= 1
                            ? `${distanceToNode.toFixed(2)} km`
                            : `${(distanceToNode * 1000).toFixed(0)} meters`}
                        {' '}to nearest node
                    </Text>
                </View>
            )}
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
    pinnedMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinImage: {
        width: 40,
        height: 40,
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
        bottom: 80,
        flexDirection: 'column',
    },
    zoomButton: {
        backgroundColor: '#4285F4',
        borderRadius: 50,
        padding: 10,
        marginBottom: 10,
    },
    floatingPinContainer: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        alignItems: 'center',
    },
    floatingPin: {
        backgroundColor: '#fff',
        borderRadius: 50,
        padding: 10,
    },
    distanceContainer: {
        position: 'absolute',
        bottom: 80,  // Positioned above the zoom controls
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        borderRadius: 5,
    },
    distanceText: {
        color: 'white',
        fontSize: 16,
    },
});

export default MapPage;
