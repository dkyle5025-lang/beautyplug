import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, formatPrice } from "../api";
import BookingModal from "../components/BookingModal";

export default function ServicesScreen({ clientId }) {
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState({}); // id -> business_name
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // service being booked

  const load = useCallback(async () => {
    setError(null);
    try {
      const [serviceRows, providerRows] = await Promise.all([
        apiFetch("/services?is_active=1"),
        apiFetch("/service-providers"),
      ]);
      const map = {};
      (providerRows || []).forEach((p) => {
        map[p.id] = p.business_name;
      });
      setProviders(map);
      setServices(serviceRows || []);
    } catch (err) {
      setError(err.message || "Could not load services.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName}>{item.service_name}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
      </View>
      {providers[item.provider_id] ? (
        <Text style={styles.provider}>{providers[item.provider_id]}</Text>
      ) : null}
      {item.service_description ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.service_description}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        <View style={styles.durationPill}>
          <Ionicons name="time-outline" size={14} color="#ad1457" />
          <Text style={styles.durationText}>{item.duration_minutes} min</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => setSelected(item)}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#d81b60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="cut-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {error || "No services available yet."}
            </Text>
            {error ? (
              <TouchableOpacity style={styles.retry} onPress={load}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      <BookingModal
        visible={!!selected}
        onClose={() => setSelected(null)}
        service={selected}
        providerName={selected ? providers[selected.provider_id] : undefined}
        clientId={clientId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  centered: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    paddingRight: 8,
  },
  price: { fontSize: 16, fontWeight: "bold", color: "#d81b60" },
  provider: { fontSize: 13, color: "#888", marginTop: 2 },
  description: { fontSize: 14, color: "#666", marginTop: 8, lineHeight: 19 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fce4ec",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  durationText: { color: "#ad1457", fontSize: 12, fontWeight: "600" },
  bookButton: {
    backgroundColor: "#d81b60",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  emptyText: { color: "#999", fontSize: 15, marginTop: 12, textAlign: "center" },
  retry: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d81b60",
  },
  retryText: { color: "#d81b60", fontWeight: "600" },
});
