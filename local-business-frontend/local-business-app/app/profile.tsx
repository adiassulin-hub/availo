import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import api from "../services/api";

type Business = {
  _id: string;
  name: string;
  category: string;
  city: string;
  status: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "owner") {
      fetchMyBusinesses();
    }
  }, [user]);

  const fetchMyBusinesses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/businesses/me/mine");
      setBusinesses(res.data || []);
    } catch (err) {
      console.log("FETCH MY BUSINESSES ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("התנתקות", "האם את בטוחה שברצונך להתנתק?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "התנתק",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return { text: "✅ מאושר", color: "#059669" };
      case "pending": return { text: "⏳ ממתין לאישור", color: "#D97706" };
      case "rejected": return { text: "❌ נדחה", color: "#DC2626" };
      case "blocked": return { text: "🚫 חסום", color: "#6B7280" };
      default: return { text: status, color: "#6B7280" };
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notLoggedTitle}>עוד לא נכנסת 👋</Text>
        <Text style={styles.notLoggedSub}>התחבר כדי לראות את הפרופיל שלך</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/auth")}
        >
          <Text style={styles.loginBtnText}>התחבר / הירשם</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>‹ חזרה</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הפרופיל שלי</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Avatar + info */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {user.role === "owner" ? "🏪 בעל עסק" : user.role === "admin" ? "⭐ מנהל" : "🛍️ לקוח"}
          </Text>
        </View>
      </View>

      {/* Owner — העסקים שלי */}
      {user.role === "owner" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>העסקים שלי</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push("/register-business")}
            >
              <Text style={styles.addBtnText}>+ הוסף עסק</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#1A1A2E" style={{ marginTop: 20 }} />
          ) : businesses.length === 0 ? (
            <View style={styles.emptyBusiness}>
              <Text style={styles.emptyBusinessEmoji}>🏪</Text>
              <Text style={styles.emptyBusinessText}>עוד אין לך עסקים רשומים</Text>
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => router.push("/register-business")}
              >
                <Text style={styles.registerBtnText}>רשום עסק עכשיו</Text>
              </TouchableOpacity>
            </View>
          ) : (
            businesses.map((business) => {
              const statusInfo = getStatusLabel(business.status);
              return (
                <TouchableOpacity
                  key={business._id}
                  style={styles.businessCard}
                  onPress={() => router.push(`/business/${business._id}`)}
                >
                  <View style={styles.businessCardLeft}>
                    <Text style={styles.businessCardName}>{business.name}</Text>
                    <Text style={styles.businessCardMeta}>
                      {business.city} · {business.category}
                    </Text>
                    <Text style={[styles.businessCardStatus, { color: statusInfo.color }]}>
                      {statusInfo.text}
                    </Text>
                  </View>
                  <Text style={styles.businessCardArrow}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* User — פעולות */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>הגדרות</Text>

        {user.role === "user" && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/register-business")}
          >
            <Text style={styles.menuItemIcon}>🏪</Text>
            <Text style={styles.menuItemText}>רשום עסק</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/map")}>
          <Text style={styles.menuItemIcon}>🗺️</Text>
          <Text style={styles.menuItemText}>מפה</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={handleLogout}
        >
          <Text style={styles.menuItemIcon}>🚪</Text>
          <Text style={[styles.menuItemText, { color: "#DC2626" }]}>התנתק</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    padding: 24,
  },
  notLoggedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  notLoggedSub: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 32,
  },
  loginBtn: {
    backgroundColor: "#1A1A2E",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 16,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    color: "#6366F1",
    fontSize: 15,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  roleBadgeText: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "600",
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  addBtn: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnText: {
    color: "#6366F1",
    fontSize: 13,
    fontWeight: "700",
  },

  // Business card
  emptyBusiness: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyBusinessEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyBusinessText: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 16,
  },
  registerBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  businessCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  businessCardLeft: {
    flex: 1,
    gap: 3,
  },
  businessCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  businessCardMeta: {
    fontSize: 13,
    color: "#6B7280",
  },
  businessCardStatus: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  businessCardArrow: {
    fontSize: 22,
    color: "#9CA3AF",
  },

  // Menu items
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  menuItemDanger: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF5F5",
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  menuItemArrow: {
    fontSize: 20,
    color: "#9CA3AF",
  },
});
