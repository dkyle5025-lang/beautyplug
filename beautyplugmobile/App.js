import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import IntroScreen from "./screens/IntroScreen";
import ProvidersScreen from "./screens/ProvidersScreen";
import UsersScreen from "./screens/UsersScreen";

const TABS = [
  { key: "intro", label: "Intro" },
  { key: "providers", label: "Providers" },
  { key: "users", label: "Users" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("intro");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {activeTab === "intro" && <IntroScreen />}
        {activeTab === "providers" && <ProvidersScreen />}
        {activeTab === "users" && <UsersScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#fff",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 14,
    color: "#868e96",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#d6336c",
    fontWeight: "700",
  },
});
