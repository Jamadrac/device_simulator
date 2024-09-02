import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TextInput, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import Toast from 'react-native-toast-message';

interface GPSDeviceProps {}

const GPSDevice: React.FC<GPSDeviceProps> = () => {
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false); // New state for controlling location updates

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleUpdateLocation = async () => {
    if (updating) {
      return; // Exit if already updating
    }

    // Use default URL if baseUrl is not provided
    const finalBaseUrl = baseUrl || 'footclan.onrender.com';

    setUpdating(true); // Set updating state to true
    setLoading(true); // Show loading indicator

    try {
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      
      await sendLocationToBackend(finalBaseUrl, serialNumber, location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error(error);
      setErrorMessage('Error updating location');
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Failed to update location.',
      });
    } finally {
      setLoading(false); // Hide loading indicator
      setUpdating(false); // Set updating state to false
    }
  };

  const handleStopUpdating = () => {
    setUpdating(false); // Stop updating by setting the state to false
    setLoading(false); // Hide loading indicator
  };

  const sendLocationToBackend = async (baseUrl: string, serialNumber: string, latitude: number, longitude: number) => {
    try {
      const response = await axios.patch(`https://${baseUrl}/api/update-location`, {
        serialNumber,
        latitude,
        longitude,
      });
  
      console.log('Location updated successfully:', response.data.message);
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Success',
        text2: 'Location updated successfully.',
      });
    } catch (error) {
      console.error('Error sending location to backend:', error);
      setErrorMessage('Failed to send location to backend');
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Failed to send location to backend.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text>GPS Device Simulator</Text>
      <View style={styles.inputContainer}>
        <Text>Base URL:</Text>
        <TextInput
          style={styles.input}
          onChangeText={setBaseUrl}
          value={baseUrl}
          placeholder="Enter base URL"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text>Serial Number:</Text>
        <TextInput
          style={styles.input}
          onChangeText={setSerialNumber}
          value={serialNumber}
          placeholder="Enter serial number"
        />
      </View>
      {location && (
        <View style={styles.locationContainer}>
          <Text>Current Location:</Text>
          <Text>Latitude: {location.coords.latitude}</Text>
          <Text>Longitude: {location.coords.longitude}</Text>
        </View>
      )}
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
      <Button title="Update Location" onPress={handleUpdateLocation} />
      <Button title="Stop" onPress={handleStopUpdating} color="red" />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    marginLeft: 10,
    width: 250, // Adjust width as needed
  },
  locationContainer: {
    marginVertical: 10,
  },
  error: {
    color: 'red',
    marginVertical: 10,
  },
  loading: {
    marginTop: 20,
  },
});

export default GPSDevice;
