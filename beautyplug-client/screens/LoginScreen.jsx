import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Fields",
        "Please enter both your email and password.",
      );
      return;
    }

    setLoading(true);

    try {
      // 2. Fire request to your live Express backend endpoint
      const response = await fetch(
        "https://beautyapi.kipchirchir.co.ke/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
          }),
          // CRITICAL: Instructs React Native to preserve and store the express-session cookie
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.ok) {
        // 3. Trigger state shift in App.js to unlock protected routes instantly
        onLoginSuccess();
      } else {
        // Handle explicit backend errors (e.g., "Invalid credentials")
        Alert.alert(
          "Sign In Failed",
          data.message || "Check your credentials and try again.",
        );
      }
    } catch (error) {
      // Handle physical connection/network failures
      Alert.alert(
        "Connection Errrror",
        "Unable to reach the server. Please check your internet connection.",
      );
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerZone}>
          <Text style={styles.brandTitle}>The Beauty Plug</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your appointments and services
          </Text>
        </View>

        <View style={styles.formZone}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="example@beauty.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#d81b60"
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account?{" "}
              <Text style={styles.boldText}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  headerZone: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#d81b60", // Matches your stack styling identity
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formZone: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    height: 52,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  loader: {
    marginVertical: 15,
  },
  loginButton: {
    backgroundColor: "#d81b60",
    height: 52,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#d81b60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3, // Android shadows
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerLink: {
    marginTop: 25,
    alignItems: "center",
  },
  registerLinkText: {
    color: "#555",
    fontSize: 14,
  },
  boldText: {
    color: "#d81b60",
    fontWeight: "bold",
  },
});
