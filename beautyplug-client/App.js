import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
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
          <>
            <Stack.Screen
              name="Dashboard"
              options={{ title: "Your Dashboard" }}
            >
              {(props) => (
                <DashboardScreen
                  {...props}
                  onLogout={() => setIsAuthenticated(false)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: "My Profile" }}
            />

            <Stack.Screen
              name="Providers"
              component={ProvidersScreen}
              options={{ title: "Our Specialists" }}
            />

            <Stack.Screen
              name="Services"
              component={ServicesScreen}
              options={{ title: "Beauty Services" }}
            />
          </>
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
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => setIsAuthenticated(true)}
                />
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
  );
}
