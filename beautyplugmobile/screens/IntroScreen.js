import { StyleSheet, Text, View, ScrollView } from "react-native";

export default function IntroScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>BP</Text>
      </View>

      <Text style={styles.title}>Welcome to BeautyPlug</Text>
      <Text style={styles.subtitle}>
        Your one-stop platform to discover and book trusted beauty service
        providers near you.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Find Providers</Text>
        <Text style={styles.cardBody}>
          Browse hair stylists, makeup artists, nail techs and more.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Book with Ease</Text>
        <Text style={styles.cardBody}>
          Compare services, check availability and book in just a few taps.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join the Community</Text>
        <Text style={styles.cardBody}>
          Connect with a growing community of clients and beauty professionals.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#d6336c",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  logoText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    width: "100%",
    backgroundColor: "#fdf2f8",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#d6336c",
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
});
