import { StyleSheet, Text, View, FlatList } from "react-native";

// Placeholder data — replace with API data later.
const PROVIDERS = [
  { id: "1", name: "Glow Studio", service: "Makeup Artist", rating: "4.8" },
  { id: "2", name: "Sharp Cuts", service: "Barber", rating: "4.6" },
  { id: "3", name: "Nail Bar Deluxe", service: "Nail Technician", rating: "4.9" },
  { id: "4", name: "Curls & Co", service: "Hair Stylist", rating: "4.7" },
];

export default function ProvidersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Service Providers</Text>

      <FlatList
        data={PROVIDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.service}>{item.service}</Text>
            </View>
            <Text style={styles.rating}>★ {item.rating}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d6336c",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  service: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f08c00",
  },
});
