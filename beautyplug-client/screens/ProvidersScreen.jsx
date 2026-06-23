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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { apiFetch, formatPrice } from "../api";
import BookingModal from "../components/BookingModal";

// approval_status -> badge styling
const STATUS_COLORS = {
  approved: { bg: "#e8f5e9", fg: "#2e7d32" },
  pending: { bg: "#fff8e1", fg: "#f57f17" },
  under_review: { bg: "#e3f2fd", fg: "#1565c0" },
  rejected: { bg: "#ffebee", fg: "#c62828" },
  suspended: { bg: "#fafafa", fg: "#757575" },
};

export default function ProvidersScreen({ clientId }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [servicesByProvider, setServicesByProvider] = useState({});
  const [loadingServices, setLoadingServices] = useState(false);
  const [selected, setSelected] = useState(null); // { service, providerName }

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await apiFetch("/service-providers");
      setProviders(rows || []);
    } catch (err) {
      setError(err.message || "Could not load providers.");
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

  const toggleExpand = async (provider) => {
    if (expandedId === provider.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(provider.id);
    if (!servicesByProvider[provider.id]) {
      setLoadingServices(true);
      try {
        const rows = await apiFetch(
          `/services?provider_id=${provider.id}&is_active=1`,
        );
        setServicesByProvider((prev) => ({ ...prev, [provider.id]: rows || [] }));
      } catch {
        setServicesByProvider((prev) => ({ ...prev, [provider.id]: [] }));
      } finally {
        setLoadingServices(false);
      }
    }
  };

  const renderItem = ({ item }) => {
    const expanded = expandedId === item.id;
    const status = STATUS_COLORS[item.approval_status] || STATUS_COLORS.pending;
    const services = servicesByProvider[item.id];

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={24}
              color="#d81b60"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName}>{item.business_name}</Text>
            <Text style={styles.category}>
              {(item.primary_category || "").replace(/_/g, " ")}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.fg }]}>
              {(item.approval_status || "").replace(/_/g, " ")}
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#999"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        {item.bio ? (
          <Text style={styles.bio} numberOfLines={expanded ? undefined : 2}>
            {item.bio}
          </Text>
        ) : null}

        {expanded ? (
          <View style={styles.servicesBlock}>
            {loadingServices && !services ? (
              <ActivityIndicator color="#d81b60" style={{ marginVertical: 12 }} />
            ) : services && services.length ? (
              services.map((svc) => (
                <View key={svc.id} style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{svc.service_name}</Text>
                    <Text style={styles.serviceMeta}>
                      {formatPrice(svc.price)} · {svc.duration_minutes} min
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() =>
                      setSelected({
                        service: svc,
                        providerName: item.business_name,
                      })
                    }
                  >
                    <Text style={styles.bookButtonText}>Book</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noServices}>
                This provider has no bookable services yet.
              </Text>
            )}
          </View>
        ) : null}
      </View>
    );
  };

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
        data={providers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={48}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              {error || "No providers found."}
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
        service={selected?.service}
        providerName={selected?.providerName}
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
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fce4ec",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  businessName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  category: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    textTransform: "capitalize",
  },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  bio: { fontSize: 14, color: "#666", marginTop: 10, lineHeight: 19 },
  servicesBlock: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 4,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  serviceName: { fontSize: 15, fontWeight: "600", color: "#333" },
  serviceMeta: { fontSize: 13, color: "#888", marginTop: 2 },
  bookButton: {
    backgroundColor: "#d81b60",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  noServices: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    paddingVertical: 10,
  },
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
