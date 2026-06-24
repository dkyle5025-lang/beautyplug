import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  auth as authApi,
  providers as providerApi,
  clients as clientApi,
} from "../api/resources.js";

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

// Resolve a client's profile id (clients.id). The API exposes no user→client
// lookup and a client cannot list /clients (admin only), but GET /clients/:id
// is readable by any authenticated user — so we find the client row whose
// user_id matches us. Fast path first (ids often align), then a bounded scan.
async function resolveClientId(user) {
  if (!user?.id) return null;

  const tryId = async (id) => {
    try {
      const c = await clientApi.get(id);
      return c && c.user_id === user.id ? c.id : null;
    } catch {
      return null; // 404 / not ours
    }
  };

  const direct = await tryId(user.id);
  if (direct) return direct;

  const ids = Array.from({ length: 50 }, (_, i) => i + 1);
  const matches = await Promise.all(ids.map(tryId));
  return matches.find((id) => id) ?? null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileId, setProfileId] = useState(null); // provider.id or client.id
  const [loading, setLoading] = useState(true); // initial session check

  // Resolve the profile id for the current user, store it, and return it.
  const resolveProfileId = useCallback(async (u) => {
    if (!u) {
      setProfileId(null);
      return null;
    }
    if (u.user_type === "provider") {
      try {
        const list = await providerApi.list();
        const mine = list.find((p) => p.user_id === u.id);
        const id = mine ? mine.id : null;
        setProfileId(id);
        return id;
      } catch {
        setProfileId(null);
        return null;
      }
    } else if (u.user_type === "client") {
      // Use the cached id when we already know it, otherwise auto-resolve it
      // from the API (no user→client lookup exists) and cache the result.
      const stored = localStorage.getItem(clientIdKey(u.id));
      if (stored) {
        setProfileId(Number(stored));
        return Number(stored);
      }
      try {
        const id = await resolveClientId(u);
        if (id) {
          localStorage.setItem(clientIdKey(u.id), String(id));
          setProfileId(id);
          return id;
        }
        setProfileId(null);
        return null;
      } catch {
        setProfileId(null);
        return null;
      }
    } else {
      setProfileId(null); // admin
      return null;
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
