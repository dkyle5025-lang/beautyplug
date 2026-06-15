import { StyleSheet, Text, View, FlatList } from "react-native";

// Placeholder data — replace with API data later.
const USERS = [
  { id: "1", name: "Alice Wanjiku", email: "alice@example.com" },
  { id: "2", name: "Brian Otieno", email: "brian@example.com" },
  { id: "3", name: "Carol Mwende", email: "carol@example.com" },
  { id: "4", name: "David Kimani", email: "david@example.com" },
  { id: "5", name: "Esther Njeri", email: "esther@example.com" },
];

export default function UsersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>All Users</Text>

      <FlatList
        data={USERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#868e96",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
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
  email: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
});
