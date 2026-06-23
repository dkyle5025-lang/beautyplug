import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { apiFetch } from "./api";

// Auth Screens
import HomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";

// Protected Screens (Import your new screens here)
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ProvidersScreen from "./screens/ProvidersScreen";
import ServicesScreen from "./screens/ServicesScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ user, clientId, setClientId, onLogout }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#d81b60" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarActiveTintColor: "#d81b60",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          height: 60 + (insets.bottom || 0),
          paddingBottom: (insets.bottom || 0) + 6,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => (
          <DashboardScreen {...props} user={user} clientId={clientId} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="scissors-cutting"
              size={size}
              color={color}
            />
          ),
        }}
      >
        {(props) => <ServicesScreen {...props} clientId={clientId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Providers"
        options={{
          title: "Providers",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              size={size}
              color={color}
            />
          ),
        }}
      >
        {(props) => <ProvidersScreen {...props} clientId={clientId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => (
          <ProfileScreen
            {...props}
            user={user}
            clientId={clientId}
            setClientId={setClientId}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);

  // Called by LoginScreen with the authenticated user object.
  const handleLoginSuccess = (loggedInUser, resolvedClientId) => {
    setUser(loggedInUser);
    setClientId(resolvedClientId ?? null);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Even if the network call fails, drop local auth state.
    }
    setIsAuthenticated(false);
    setUser(null);
    setClientId(null);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "#d81b60", // Beauty brand color identity
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          {isAuthenticated ? (
            // ================================================
            // PROTECTED ROUTES (Only accessible when logged in)
            // ================================================
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {() => (
                <MainTabs
                  user={user}
                  clientId={clientId}
                  setClientId={setClientId}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
          ) : (
            // ================================================
            // AUTH ROUTES (Only accessible when logged out)
            // ================================================
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="Login" options={{ title: "Sign In" }}>
                {(props) => (
                  <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: "Create Account" }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
