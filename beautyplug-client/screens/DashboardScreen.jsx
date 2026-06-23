import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { apiFetch, formatPrice } from "../api";

const STATUS_COLORS = {
  requested: { bg: "#fff8e1", fg: "#f57f17" },
  confirmed: { bg: "#e8f5e9", fg: "#2e7d32" },
  completed: { bg: "#e3f2fd", fg: "#1565c0" },
  cancelled: { bg: "#ffebee", fg: "#c62828" },
  no_show: { bg: "#fafafa", fg: "#757575" },
};

const CANCELLABLE = ["requested", "confirmed"];

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardScreen({ navigation, user, clientId }) {
  const [bookings, setBookings] = useState([]);
  const [serviceNames, setServiceNames] = useState({});
  const [providerNames, setProviderNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const [bookingRows, serviceRows, providerRows] = await Promise.all([
        apiFetch(`/bookings?client_id=${clientId}`),
        apiFetch("/services"),
        apiFetch("/service-providers"),
      ]);
      const svc = {};
      (serviceRows || []).forEach((s) => {
        svc[s.id] = s.service_name;
      });
      const prov = {};
      (providerRows || []).forEach((p) => {
        prov[p.id] = p.business_name;
      });
      setServiceNames(svc);
      setProviderNames(prov);
      setBookings(bookingRows || []);
    } catch (err) {
      setError(err.message || "Could not load your bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const cancelBooking = (booking) => {
    Alert.alert(
      "Cancel booking?",
      `Cancel your ${serviceNames[booking.service_id] || "booking"} on ${formatDate(
        booking.service_date,
      )}?`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch(`/bookings/${booking.id}`, { method: "DELETE" });
              load();
            } catch (err) {
              Alert.alert("Could not cancel", err.message || "Try again.");
            }
          },
        },
      ],
    );
  };

  const firstName = user?.first_name || "there";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Greeting */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>Hi {firstName} 👋</Text>
        <Text style={styles.subtitle}>Ready for your next beauty session?</Text>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Services")}
        >
          <MaterialCommunityIcons
            name="scissors-cutting"
            size={26}
            color="#d81b60"
          />
          <Text style={styles.actionText}>Browse services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Providers")}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={26}
            color="#d81b60"
          />
          <Text style={styles.actionText}>Find providers</Text>
        </TouchableOpacity>
      </View>

      {/* Profile setup prompt */}
      {!clientId ? (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="alert-circle" size={20} color="#f57f17" />
          <Text style={styles.bannerText}>
            Finish setting up your profile to start booking.
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Bookings */}
      <Text style={styles.sectionTitle}>Your bookings</Text>

      {loading ? (
        <ActivityIndicator color="#d81b60" style={{ marginTop: 24 }} />
      ) : error ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>
            No bookings yet. Book a service to see it here.
          </Text>
        </View>
      ) : (
        bookings.map((b) => {
          const status = STATUS_COLORS[b.booking_status] || STATUS_COLORS.requested;
          return (
            <View key={b.id} style={styles.bookingCard}>
              <View style={styles.bookingTop}>
                <Text style={styles.bookingService}>
                  {serviceNames[b.service_id] || `Service #${b.service_id}`}
                </Text>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.fg }]}>
                    {(b.booking_status || "").replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
              {providerNames[b.provider_id] ? (
                <Text style={styles.bookingProvider}>
                  {providerNames[b.provider_id]}
                </Text>
              ) : null}
              <View style={styles.bookingMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={15} color="#888" />
                  <Text style={styles.metaText}>{formatDate(b.service_date)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={15} color="#888" />
                  <Text style={styles.metaText}>
                    {String(b.start_time).slice(0, 5)}
                  </Text>
                </View>
                <Text style={styles.bookingPrice}>
                  {formatPrice(b.service_price)}
                </Text>
              </View>
              {CANCELLABLE.includes(b.booking_status) ? (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelBooking(b)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 16, paddingBottom: 32 },
  hero: { marginBottom: 18 },
  greeting: { fontSize: 24, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 15, color: "#777", marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: { fontSize: 13, fontWeight: "600", color: "#444" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  bannerText: { flex: 1, color: "#8d6e00", fontSize: 13 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  emptyBox: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { color: "#999", fontSize: 14, textAlign: "center" },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingService: { fontSize: 16, fontWeight: "bold", color: "#333", flex: 1 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  bookingProvider: { fontSize: 13, color: "#888", marginTop: 2 },
  bookingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: "#666" },
  bookingPrice: {
    marginLeft: "auto",
    fontSize: 15,
    fontWeight: "bold",
    color: "#d81b60",
  },
  cancelButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelText: { color: "#c62828", fontWeight: "600", fontSize: 13 },
  retry: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d81b60",
  },
  retryText: { color: "#d81b60", fontWeight: "600" },
});
