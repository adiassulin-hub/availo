import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";

type Mode = "login" | "register";
type Role = "user" | "owner";

export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("שגיאה", "נא למלא אימייל וסיסמה");
      return;
    }
    if (mode === "register" && !name.trim()) {
      Alert.alert("שגיאה", "נא למלא שם");
      return;
    }
    if (password.length < 6) {
      Alert.alert("שגיאה", "הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password, role);
      }
      // ניווט לפי role
      if (role === "owner" && mode === "register") {
        router.replace("/register-business");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "משהו השתבש, נסה שוב";
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Availo ✦</Text>
          <Text style={styles.tagline}>
            {mode === "login" ? "ברוך הבא חזרה 👋" : "הצטרף לקהילה 🚀"}
          </Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>
              התחברות
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
            onPress={() => setMode("register")}
          >
            <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>
              הרשמה
            </Text>
          </TouchableOpacity>
        </View>

        {/* Role selector (רק בהרשמה) */}
        {mode === "register" && (
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>אני רוצה להצטרף כ:</Text>
            <View style={styles.roleToggle}>
              <TouchableOpacity
                style={[styles.roleBtn, role === "user" && styles.roleBtnActive]}
                onPress={() => setRole("user")}
              >
                <Text style={styles.roleEmoji}>🛍️</Text>
                <Text style={[styles.roleBtnText, role === "user" && styles.roleBtnTextActive]}>
                  לקוח
                </Text>
                <Text style={[styles.roleSubText, role === "user" && styles.roleSubTextActive]}>
                  חיפוש עסקים
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === "owner" && styles.roleBtnActive]}
                onPress={() => setRole("owner")}
              >
                <Text style={styles.roleEmoji}>🏪</Text>
                <Text style={[styles.roleBtnText, role === "owner" && styles.roleBtnTextActive]}>
                  בעל עסק
                </Text>
                <Text style={[styles.roleSubText, role === "owner" && styles.roleSubTextActive]}>
                  רישום עסק
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {mode === "register" && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>שם מלא</Text>
              <TextInput
                style={styles.input}
                placeholder="ישראל ישראלי"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>אימייל</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>סיסמה</Text>
            <TextInput
              style={styles.input}
              placeholder="לפחות 6 תווים"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === "login" ? "התחבר" : role === "owner" ? "הירשם ורשום עסק ›" : "הירשם"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setMode(mode === "login" ? "register" : "login")}
          >
            <Text style={styles.switchBtnText}>
              {mode === "login"
                ? "אין לך חשבון עדיין? הירשם"
                : "כבר יש לך חשבון? התחבר"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.skipBtnText}>המשך ללא התחברות</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 6,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  modeBtnTextActive: {
    color: "#1A1A2E",
  },

  // Role selector
  roleSection: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    textAlign: "right",
  },
  roleToggle: {
    flexDirection: "row",
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  roleBtnActive: {
    borderColor: "#1A1A2E",
    backgroundColor: "#1A1A2E",
  },
  roleEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  roleBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  roleBtnTextActive: {
    color: "#fff",
  },
  roleSubText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  roleSubTextActive: {
    color: "rgba(255,255,255,0.7)",
  },

  // Form
  form: {
    gap: 16,
  },
  inputWrapper: {
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
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    textAlign: "right",
  },
  submitBtn: {
    backgroundColor: "#1A1A2E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  switchBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  switchBtnText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },

  // Skip
  skipBtn: {
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
