import { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import api from "../services/api";

type Business = {
  _id: string;
  name: string;
  category: string;
  city: string;
  geo?: {
    coordinates: number[];
  };
};

export default function MapScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await api.get("/businesses");
        setBusinesses(res.data.items || []);
      } catch (error) {
        console.log("MAP FETCH ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 31.8044,
          longitude: 34.6553,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        {businesses.map((business) => {
          const coords = business.geo?.coordinates;

          if (!coords || coords.length < 2) return null;

          return (
            <Marker
              key={business._id}
              coordinate={{
                latitude: coords[1],
                longitude: coords[0],
              }}
              title={business.name}
              description={`${business.category} • ${business.city}`}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
});