import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import api from "../../services/api";
import { useAuth } from "../context/AuthContext";

type Business = {
  _id: string;
  name: string;
  category: string;
  city: string;
  avgRating?: number;
  reviewsCount?: number;
  description?: string;
};

const CATEGORIES = [
  { label: "הכל", value: "" },
  { label: "👗 שמלות", value: "השכרת שמלות" },
  { label: "🍲 אוכל ביתי", value: "אוכל ביתי" },
  { label: "💄 קוסמטיקה", value: "קוסמטיקה" },
  { label: "✨ לייזר", value: "לייזר" },
  { label: "💆 גבות", value: "גבות" },
  { label: "✂️ ספר", value: "ספר" },
  { label: "📚 מורה", value: "מורה פרטי" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, [selectedCategory]);

  const fetchBusinesses = async (q = search) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get("/businesses", { params });
      setBusinesses(res.data.items || []);
    } catch (error) {
      console.log("FETCH BUSINESSES ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onSearch = () => fetchBusinesses(search);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Availo ✦</Text>
          <Text style={styles.subtitle}>עסקים קטנים, קרוב אליך</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => router.push("/map")}
          >
            <Text style={styles.mapBtnText}>🗺️</Text>
          </TouchableOpacity>
          {user ? (
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push("/auth")}
            >
              <Text style={styles.avatarText}>
                {user.name[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/auth")}
            >
              <Text style={styles.loginBtnText}>התחבר</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Owner banner */}
      {user?.role === "owner" && (
        <TouchableOpacity
          style={styles.ownerBanner}
          onPress={() => router.push("/register-business")}
        >
          <Text style={styles.ownerBannerText}>🏪 הוסף עסק חדש +</Text>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="חפש עסק, שירות, עיר..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
          <Text style={styles.searchBtnText}>חפש</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.value && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A1A2E" />
          <Text style={styles.loadingText}>טוען עסקים...</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            setRefreshing(true);
            fetchBusinesses();
          }}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/business/${item._id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardMain}>
                  <Text style={styles.businessName}>{item.name}</Text>
                  <Text style={styles.businessMeta}>
                    📍 {item.city} · {item.category}
                  </Text>
                  {item.description ? (
                    <Text style={styles.businessDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  {item.avgRating ? (
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingText}>
                        ★ {item.avgRating.toFixed(1)}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.ratingPill, styles.ratingPillNew]}>
                      <Text style={styles.ratingTextNew}>חדש</Text>
                    </View>
                  )}
                  <Text style={styles.reviewCount}>
                    {item.reviewsCount ?? 0} ביקורות
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardCta}>צפה בפרטים ›</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>לא נמצאו עסקים</Text>
              <Text style={styles.emptySubtext}>נסה קטגוריה אחרת או חיפוש שונה</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  mapBtn: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mapBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  avatarBtn: {
    backgroundColor: "#1A1A2E",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  ownerBanner: {
    backgroundColor: "#EEF2FF",
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  ownerBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366F1",
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
  },
  searchBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  categoriesScroll: {
    marginBottom: 14,
  },
  categoriesRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },
  categoryChipText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardMain: {
    flex: 1,
  },
  businessName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  businessMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  businessDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  ratingPill: {
    backgroundColor: "#1A1A2E",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingPillNew: {
    backgroundColor: "#EEF2FF",
  },
  ratingText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  ratingTextNew: {
    color: "#6366F1",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  cardFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  cardCta: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "600",
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
