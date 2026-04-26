import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Animated,
  TextInput,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import api from "../services/api";

type Business = {
  _id: string;
  name: string;
  category: string;
  city: string;
  avgRating?: number;
  geo?: { coordinates: number[] };
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "השכרת שמלות": "👗",
  "לייזר": "✨",
  "גבות": "💆",
  "אוכל ביתי": "🍲",
  "ספר": "✂️",
  "מורה פרטי": "📚",
  "קוסמטיקה": "💄",
  "אחר": "🏪",
};

const ISRAEL_REGION: Region = {
  latitude: 32.0853,
  longitude: 34.7818,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(ISRAEL_REGION);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [searchText, setSearchText] = useState("");
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const userRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setCurrentRegion(userRegion);
        mapRef.current?.animateToRegion(userRegion, 800);
        fetchBusinesses(userRegion, "");
      } else {
        fetchBusinesses(ISRAEL_REGION, "");
      }
    } catch {
      fetchBusinesses(ISRAEL_REGION, "");
    }
  };

  const fetchBusinesses = async (region: Region, q: string) => {
    try {
      setSearching(true);
      const radiusKm = Math.max(
        region.latitudeDelta * 111,
        region.longitudeDelta * 85
      ).toFixed(1);

      const params: Record<string, string> = {
        lat: String(region.latitude),
        lng: String(region.longitude),
        radiusKm,
      };
      if (q.trim()) params.q = q.trim();

      const res = await api.get("/businesses/map/pins", { params });
      setBusinesses(res.data || []);
    } catch (err) {
      console.log("MAP FETCH ERROR:", err);
    } finally {
      setLoading(false);
      setSearching(false);
      setShowSearchHere(false);
    }
  };

  // כשמזיזים את המפה — מציג כפתור "חפש באיזור זה"
  const onRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);
    setShowSearchHere(true);
    hideCard();
  }, []);

  const handleSearch = () => {
    fetchBusinesses(currentRegion, searchText);
  };

  const goToMyLocation = () => {
    if (!userLocation) return;
    const region = {
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    mapRef.current?.animateToRegion(region, 600);
    fetchBusinesses(region, searchText);
    setShowSearchHere(false);
  };

  const showCard = (business: Business) => {
    setSelectedBusiness(business);
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  const hideCard = () => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setSelectedBusiness(null));
  };

  return (
    <View style={styles.root}>

      {/* ── שורת חיפוש + חזרה ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="חפש לק גל, אוכל ביתי, ספר..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#9CA3AF"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText("");
                fetchBusinesses(currentRegion, "");
              }}
            >
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>חפש</Text>
        </TouchableOpacity>
      </View>

      {/* כפתור "חפש באיזור זה" — מופיע אחרי הזזת המפה */}
      {showSearchHere && (
        <View style={styles.searchHereContainer}>
          <TouchableOpacity
            style={styles.searchHereBtn}
            onPress={() => fetchBusinesses(currentRegion, searchText)}
          >
            {searching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchHereText}>🔍 חפש באיזור זה</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={ISRAEL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={hideCard}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {businesses.map((business) => {
          const coords = business.geo?.coordinates;
          if (!coords || coords.length < 2) return null;
          const emoji = CATEGORY_EMOJIS[business.category] ?? "🏪";
          const isSelected = selectedBusiness?._id === business._id;

          return (
            <Marker
              key={business._id}
              coordinate={{ latitude: coords[1], longitude: coords[0] }}
              onPress={() => showCard(business)}
            >
              <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
                <Text style={styles.markerEmoji}>{emoji}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* טעינה ראשונית */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1A1A2E" />
          <Text style={styles.loadingText}>טוען מפה...</Text>
        </View>
      )}

      {/* כפתור מיקום */}
      <TouchableOpacity style={styles.locationBtn} onPress={goToMyLocation}>
        <Text style={styles.locationBtnText}>📍</Text>
      </TouchableOpacity>

      {/* Badge מספר עסקים */}
      {!loading && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {searching
              ? "מחפש..."
              : searchText
              ? `${businesses.length} תוצאות עבור "${searchText}"`
              : `${businesses.length} עסקים באיזור`}
          </Text>
        </View>
      )}

      {/* כרטיס עסק נבחר */}
      {selectedBusiness && (
        <Animated.View
          style={[
            styles.businessCard,
            {
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [200, 0],
                  }),
                },
              ],
              opacity: cardAnim,
            },
          ]}
        >
          <TouchableOpacity style={styles.cardClose} onPress={hideCard}>
            <Text style={styles.cardCloseText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.cardInner}>
            <View style={styles.cardEmoji}>
              <Text style={styles.cardEmojiText}>
                {CATEGORY_EMOJIS[selectedBusiness.category] ?? "🏪"}
              </Text>
            </View>
            <View style={styles.cardCenter}>
              <Text style={styles.cardName}>{selectedBusiness.name}</Text>
              <Text style={styles.cardMeta}>
                {selectedBusiness.city} · {selectedBusiness.category}
              </Text>
              {selectedBusiness.avgRating ? (
                <Text style={styles.cardRating}>★ {selectedBusiness.avgRating.toFixed(1)}</Text>
              ) : (
                <Text style={styles.cardNew}>✨ חדש</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.cardBtn}
              onPress={() => router.push(`/business/${selectedBusiness._id}`)}
            >
              <Text style={styles.cardBtnText}>פרטים ›</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },

  // Top bar
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    gap: 6,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    textAlign: "right",
  },
  clearBtn: {
    fontSize: 12,
    color: "#9CA3AF",
    paddingHorizontal: 4,
  },
  searchBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Search here
  searchHereContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 92,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  searchHereBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    minWidth: 170,
    alignItems: "center",
  },
  searchHereText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Markers
  markerContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#1A1A2E",
  },
  markerSelected: { backgroundColor: "#1A1A2E" },
  markerEmoji: { fontSize: 18 },

  // Loading
  loadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6B7280" },

  // Location & count
  locationBtn: {
    position: "absolute",
    bottom: 180,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  locationBtnText: { fontSize: 22 },
  countBadge: {
    position: "absolute",
    bottom: 180,
    left: 16,
    backgroundColor: "rgba(26,26,46,0.9)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  countText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Business card
  businessCard: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  cardClose: {
    position: "absolute",
    top: 10, right: 14,
    zIndex: 10,
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardCloseText: { fontSize: 11, color: "#6B7280", fontWeight: "700" },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cardEmoji: {
    width: 52, height: 52,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardEmojiText: { fontSize: 26 },
  cardCenter: { flex: 1, gap: 2 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardMeta: { fontSize: 13, color: "#6B7280" },
  cardRating: { fontSize: 13, color: "#FBBF24", fontWeight: "600" },
  cardNew: { fontSize: 12, color: "#6366F1", fontWeight: "600" },
  cardBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
