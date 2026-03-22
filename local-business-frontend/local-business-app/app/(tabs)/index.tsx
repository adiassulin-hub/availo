import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import api from "../../services/api";

type Business = {
  _id: string;
  name: string;
  category: string;
  city: string;
  avgRating?: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await api.get("/businesses");
        setBusinesses(res.data.items || []);
      } catch (error) {
        console.log("FETCH BUSINESSES ERROR:", error);
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
        <Text style={styles.loadingText}>Loading businesses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Availo</Text>
      <Text style={styles.subtitle}>Discover businesses near you</Text>

      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/map")}>
          <Text style={styles.actionButtonText}>Map View</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryActionButton}>
          <Text style={styles.secondaryActionButtonText}>My Account</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={businesses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.businessName}>{item.name}</Text>
            <Text style={styles.businessMeta}>
              {item.city} • {item.category}
            </Text>
            <Text style={styles.rating}>
              ⭐ {item.avgRating ? item.avgRating : "New"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No businesses found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 70,
    paddingHorizontal: 20,
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
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 18,
  },
  topButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryActionButtonText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  businessName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  businessMeta: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },
  rating: {
    fontSize: 14,
    color: "#111827",
    marginTop: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 40,
    fontSize: 16,
  },
});