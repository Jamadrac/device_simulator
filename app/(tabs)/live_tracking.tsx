import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import * as Location from "expo-location";
import { io, Socket } from "socket.io-client";
import { baseUrl } from "@/components/url";

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
  };
}

const LocationTracker: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);

  const deviceId = "unique-device-id"; // Replace with actual unique device ID

  useEffect(() => {
    const newSocket = io(`${baseUrl}`);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
    })();
  }, []);

  const startTracking = async () => {
    setIsTracking(true);
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        setLocation(newLocation);
        if (socket) {
          socket.emit("location_update", {
            deviceId,
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      }
    );
    setLocationSubscription(subscription);
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
  };

  return (
    <View>
      <Text>Device ID: {deviceId}</Text>
      {errorMsg ? <Text>{errorMsg}</Text> : null}
      {location ? (
        <Text>
          Latitude: {location.coords.latitude}, Longitude:{" "}
          {location.coords.longitude}
        </Text>
      ) : (
        <Text>Waiting for location...</Text>
      )}
      {isTracking ? (
        <Button title="Stop Tracking" onPress={stopTracking} />
      ) : (
        <Button title="Start Tracking" onPress={startTracking} />
      )}
    </View>
  );
};

export default LocationTracker;
