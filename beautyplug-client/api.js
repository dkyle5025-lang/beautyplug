// Central API helper for the BeautyPlug client app.
// Auth is session + cookie based, so every request sends credentials.

export const API_BASE = "https://beautyapi.kipchirchir.co.ke";

/**
 * Thin fetch wrapper: attaches JSON headers + the session cookie, parses the
 * JSON body and throws a readable Error (with `.status`) on non-2xx responses.
 */
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // preserve the express-session cookie
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // Some endpoints (rarely) return empty bodies; guard the parse.
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}

/**
 * Resolve the logged-in user's client-profile id.
 *
 * The API has no `user_id -> client_id` lookup and a client cannot list
 * `/clients` (admin only). However `GET /clients/:id` is readable by any
 * authenticated user, so we find the client row whose `user_id` matches us.
 * Fast path first (ids frequently align), then a bounded scan as a fallback.
 *
 * Returns the numeric client id, or null if it could not be resolved.
 */
export async function resolveClientId(user) {
  if (!user || !user.id) return null;

  const tryId = async (id) => {
    try {
      const client = await apiFetch(`/clients/${id}`);
      return client && client.user_id === user.id ? client.id : null;
    } catch {
      return null; // 404 / not ours
    }
  };

  // Fast path: the user's client row id often equals the user id.
  const direct = await tryId(user.id);
  if (direct) return direct;

  // Fallback: scan a bounded range of client ids for the one that belongs to us.
  const ids = Array.from({ length: 50 }, (_, i) => i + 1);
  const matches = await Promise.all(ids.map(tryId));
  return matches.find((id) => id) ?? null;
}

/** Format a DECIMAL string/number as a currency label. */
export function formatPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `KSh ${n.toFixed(2)}` : `KSh ${value}`;
}
