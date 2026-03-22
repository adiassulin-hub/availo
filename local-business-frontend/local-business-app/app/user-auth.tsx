import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "expo-router";

export default function UserAuthScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://192.168.1.10:5000/api/auth/login", {
        email,
        password,
      });

      console.log("TOKEN:", res.data.token);

      router.replace("/(tabs)");
    } catch (err) {
      console.log("LOGIN ERROR", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Login</Text>
      <Text style={styles.subtitle}>Login or create an account</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={setPassword}
        value={password}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.primaryButtonText}>Login as User</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Create User Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 14,
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "600",
  },
});