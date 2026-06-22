import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { auth as authApi, providers as providerApi } from "../api/resources.js";

// ---------------------------------------------------------------------------
// AuthContext holds the logged-in user plus their role-specific *profile id*:
//
//   • providers  → service_providers.id  (resolvable from GET /service-providers
//                  by matching user_id, so we look it up automatically)
//   • clients    → clients.id            (the API exposes no user→client lookup,
//                  so we persist it in localStorage once it is known/entered)
//
// Both are needed because booking/favorite/rating endpoints key off the
// profile id, not the user id.
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

const clientIdKey = (userId) => `beautyplug.clientId.${userId}`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileId, setProfileId] = useState(null); // provider.id or client.id
  const [loading, setLoading] = useState(true); // initial session check

  // Resolve the profile id for the current user and store it.
  const resolveProfileId = useCallback(async (u) => {
    if (!u) {
      setProfileId(null);
      return;
    }
    if (u.user_type === "provider") {
      try {
        const list = await providerApi.list();
        const mine = list.find((p) => p.user_id === u.id);
        setProfileId(mine ? mine.id : null);
      } catch {
        setProfileId(null);
      }
    } else if (u.user_type === "client") {
      const stored = localStorage.getItem(clientIdKey(u.id));
      setProfileId(stored ? Number(stored) : null);
    } else {
      setProfileId(null); // admin
    }
  }, []);

  // Check for an existing session on first load.
  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then(async ({ user: me }) => {
        if (!active) return;
        setUser(me);
        await resolveProfileId(me);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resolveProfileId]);

  const login = useCallback(
    async (email, password) => {
      const { user: me } = await authApi.login(email, password);
      setUser(me);
      await resolveProfileId(me);
      return me;
    },
    [resolveProfileId],
  );

  const register = useCallback(
    async (payload) => {
      const { user: me } = await authApi.register(payload);
      setUser(me);
      await resolveProfileId(me);
      return me;
    },
    [resolveProfileId],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setProfileId(null);
    }
  }, []);

  // Let the Profile page persist a client's profile id for future sessions.
  const setClientProfileId = useCallback(
    (id) => {
      if (!user) return;
      localStorage.setItem(clientIdKey(user.id), String(id));
      setProfileId(Number(id));
    },
    [user],
  );

  const value = {
    user,
    profileId,
    loading,
    isAuthed: !!user,
    isClient: user?.user_type === "client",
    isProvider: user?.user_type === "provider",
    isAdmin: user?.user_type === "admin",
    login,
    register,
    logout,
    setUser,
    setClientProfileId,
    refreshProfileId: () => resolveProfileId(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
