import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, resolveClientId } from "../api";

export default function ProfileScreen({ user, clientId, setClientId, onLogout }) {
  const [bio, setBio] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedId, setResolvedId] = useState(clientId);

  const load = useCallback(
    async (id) => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const client = await apiFetch(`/clients/${id}`);
        setBio(client.bio || "");
        setPictureUrl(client.profile_picture_url || "");
      } catch {
        // Non-fatal: fall back to empty editable fields.
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setResolvedId(clientId);
    load(clientId);
  }, [clientId, load]);

  // Retry resolving the client profile id (used when login couldn't find it).
  const retryResolve = async () => {
    setResolving(true);
    try {
      const id = await resolveClientId(user);
      if (id) {
        setResolvedId(id);
        setClientId?.(id);
        setLoading(true);
        await load(id);
      } else {
        Alert.alert(
          "Profile not found",
          "We couldn't locate your client profile on the server.",
        );
      }
    } finally {
      setResolving(false);
    }
  };

  const handleSave = async () => {
    if (!resolvedId) {
      retryResolve();
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/clients/${resolvedId}`, {
        method: "PUT",
        body: JSON.stringify({
          bio: bio.trim(),
          profile_picture_url: pictureUrl.trim(),
        }),
      });
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (err) {
      Alert.alert("Could not save", err.message || "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: onLogout },
    ]);
  };

  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Identity header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "?"}</Text>
          </View>
          <Text style={styles.name}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Account details */}
        <View style={styles.infoCard}>
          <InfoRow icon="call-outline" label="Phone" value={user?.phone} />
          <InfoRow
            icon="person-outline"
            label="Account"
            value={user?.user_type}
          />
        </View>

        {/* Profile not resolved */}
        {!resolvedId ? (
          <View style={styles.banner}>
            <Ionicons name="information-circle" size={20} color="#1565c0" />
            <Text style={styles.bannerText}>
              We couldn't load your client profile id, which is needed for
              booking. Tap below to set it up.
            </Text>
          </View>
        ) : null}

        {/* Editable client profile */}
        <Text style={styles.sectionTitle}>Your profile</Text>
        {loading ? (
          <ActivityIndicator color="#d81b60" style={{ marginVertical: 20 }} />
        ) : (
          <View>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell providers a little about yourself"
              placeholderTextColor="#999"
              multiline
              editable={!!resolvedId}
            />

            <Text style={styles.label}>Profile picture URL</Text>
            <TextInput
              style={styles.input}
              value={pictureUrl}
              onChangeText={setPictureUrl}
              placeholder="https://…/me.jpg"
              placeholderTextColor="#999"
              autoCapitalize="none"
              editable={!!resolvedId}
            />

            {saving || resolving ? (
              <View style={[styles.saveButton, styles.disabled]}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {resolvedId ? "Save profile" : "Set up profile"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#c62828" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#888" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 16, paddingBottom: 32 },
  header: { alignItems: "center", marginVertical: 16 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#d81b60",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "bold" },
  name: { fontSize: 20, fontWeight: "bold", color: "#333" },
  email: { fontSize: 14, color: "#777", marginTop: 2 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 14, color: "#666" },
  infoValue: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerText: { flex: 1, color: "#1565c0", fontSize: 13 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  multiline: { height: 100, textAlignVertical: "top" },
  saveButton: {
    backgroundColor: "#d81b60",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  disabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1c0c0",
    backgroundColor: "#fff",
  },
  logoutText: { color: "#c62828", fontSize: 15, fontWeight: "600" },
});
