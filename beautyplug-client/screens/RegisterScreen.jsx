import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    password: "",
  });

  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleRegister = async () => {
    // Structural validation
    const { email, phone, first_name, last_name, password } = formData;
    if (!email || !phone || !first_name || !last_name || !password) {
      Alert.alert("Error", "Please fill in all the fields.");
      return;
    }

    // Explicit payload mapping required by your API
    const apiPayload = {
      email: email.trim(),
      phone: phone.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      password: password,
      user_type: "client", // Hardcoded safely away from the UI inputs
    };

    try {
      console.log("Sending payload to API:", apiPayload);

      // Example endpoint submission:
      const response = await fetch(
        "https://beautyapi.kipchirchir.co.ke/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        },
      );

      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join beauty plug today</Text>

        {/* Input Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Jane"
            value={formData.first_name}
            onChangeText={(val) => handleChange("first_name", val)}
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Doe"
            value={formData.last_name}
            onChangeText={(val) => handleChange("last_name", val)}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(val) => handleChange("email", val)}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+254700000000"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(val) => handleChange("phone", val)}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={formData.password}
            onChangeText={(val) => handleChange("password", val)}
          />

          {/* Register Action Button */}
          <Pressable style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
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
  title: { fontSize: 26, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24, marginTop: 4 },
  form: { width: "100%" },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#d81b60",
    width: "100%",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
