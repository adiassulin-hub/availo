import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function ChooseRoleScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Availo</Text>
      <Text style={styles.subtitle}>How would you like to continue?</Text>

      <TouchableOpacity
        style={styles.userButton}
        onPress={() => router.push("/user-auth")}
      >
        <Text style={styles.userButtonText}>Continue as User</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.businessButton}
        onPress={() => router.push("/business-auth")}
      >
        <Text style={styles.businessButtonText}>Continue as Business</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 40,
  },
  userButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  userButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  businessButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  businessButtonText: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "600",
  },
});