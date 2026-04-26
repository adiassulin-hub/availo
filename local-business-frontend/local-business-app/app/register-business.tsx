import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import api from "../services/api";

const CATEGORIES = [
  { label: "👗 השכרת שמלות", value: "השכרת שמלות" },
  { label: "✨ לייזר", value: "לייזר" },
  { label: "💆 גבות", value: "גבות" },
  { label: "🍲 אוכל ביתי", value: "אוכל ביתי" },
  { label: "✂️ ספר", value: "ספר" },
  { label: "📚 מורה פרטי", value: "מורה פרטי" },
  { label: "💄 קוסמטיקה", value: "קוסמטיקה" },
  { label: "🏪 אחר", value: "אחר" },
];

export default function RegisterBusinessScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const getMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("שגיאה", "לא ניתנה הרשאת מיקום");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      // נסה לקבל כתובת מהמיקום
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo[0]) {
        const g = geo[0];
        if (g.city && !city) setCity(g.city);
        if (g.street && !address) {
          setAddress(`${g.street}${g.streetNumber ? " " + g.streetNumber : ""}`);
        }
      }

      Alert.alert("✅ מיקום נקלט!", "המיקום שלך נשמר בהצלחה");
    } catch (e) {
      Alert.alert("שגיאה", "לא הצלחנו לקבל את המיקום שלך");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category || !city.trim()) {
      Alert.alert("שגיאה", "נא למלא שם, קטגוריה ועיר");
      return;
    }
    if (!coords) {
      Alert.alert("שגיאה", "נא לאפשר מיקום על ידי לחיצה על 'קבע מיקום אוטומטי'");
      return;
    }

    setLoading(true);
    try {
      await api.post("/businesses", {
        name: name.trim(),
        category,
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        instagram: instagram.trim(),
        description: description.trim(),
        lat: coords.lat,
        lng: coords.lng,
      });

      Alert.alert(
        "🎉 נשלח לאישור!",
        "העסק שלך נשלח לבדיקה ויאושר בקרוב. תקבל הודעה כשיהיה מאושר.",
        [{ text: "אוקי", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || "משהו השתבש, נסה שוב";
      Alert.alert("שגיאה", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>רשום את העסק שלך 🏪</Text>
            <Text style={styles.subtitle}>הצטרף לאלפי עסקים קטנים ב-Availo</Text>
          </View>
        </View>

        {/* Progress hint */}
        <View style={styles.progressHint}>
          <Text style={styles.progressText}>
            ⏱️ לוקח בערך 2 דקות • בדיקה תוך 24 שעות
          </Text>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטים בסיסיים</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>שם העסק *</Text>
            <TextInput
              style={styles.input}
              placeholder="שם העסק שלך"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>קטגוריה *</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    category === cat.value && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat.value && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>תיאור קצר</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="ספר ללקוחות מה אתה מציע, מה מיוחד בך..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מיקום</Text>

          <TouchableOpacity
            style={[styles.locationBtn, coords && styles.locationBtnSuccess]}
            onPress={getMyLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.locationBtnIcon}>
                  {coords ? "✅" : "📍"}
                </Text>
                <Text style={styles.locationBtnText}>
                  {coords ? "מיקום נקלט! לחץ לעדכון" : "קבע מיקום אוטומטי"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>עיר *</Text>
              <TextInput
                style={styles.input}
                placeholder="תל אביב"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1.5 }]}>
              <Text style={styles.inputLabel}>כתובת</Text>
              <TextInput
                style={styles.input}
                placeholder="רחוב ומספר"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>יצירת קשר</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>📞 טלפון / וואטסאפ</Text>
            <TextInput
              style={styles.input}
              placeholder="050-0000000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>📸 אינסטגרם</Text>
            <TextInput
              style={styles.input}
              placeholder="@your_business"
              value={instagram}
              onChangeText={setInstagram}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>שלח לאישור 🚀</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          העסק יעבור בדיקה קצרה לפני שיופיע באפליקציה
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  // Progress
  progressHint: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "600",
    textAlign: "center",
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  inputWrapper: {
    marginBottom: 14,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textAlign: "right",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
    textAlign: "right",
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },

  // Categories
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#fff",
  },

  // Location
  locationBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  locationBtnSuccess: {
    backgroundColor: "#059669",
  },
  locationBtnIcon: {
    fontSize: 18,
  },
  locationBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // Submit
  submitBtn: {
    backgroundColor: "#1A1A2E",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
