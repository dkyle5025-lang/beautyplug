import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome to beauty plug</Text>
        <Text style={styles.subtitle}>Your ultimate beauty companion</Text>
      </View>

      {/* Navigation Layer */}
      <View style={styles.buttonContainer}>
        {/* Login Trigger */}
        <Pressable
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        {/* Register Trigger */}
        <Pressable
          style={[styles.button, styles.registerButton]}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={[styles.buttonText, styles.registerText]}>Register</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  headerContainer: { alignItems: "center", marginBottom: 50 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: { fontSize: 16, color: "#666", marginTop: 10 },
  buttonContainer: { width: "100%", gap: 15 },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButton: { backgroundColor: "#d81b60" },
  registerButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#d81b60",
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  registerText: { color: "#d81b60" },
});
