// Central HTTP client for the BeautyPlug API.
//
// The API is session-cookie based, so every request must send credentials so
// the `beautyplug.sid` cookie is included (see api/README.md → Authentication).
//
// Base URL resolution order:
//   1. VITE_API_URL (set in .env / .env.local for production builds)
//   2. http://localhost:3000 (default for local development)

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

// Error thrown for any non-2xx response. Carries the HTTP status and the
// server's JSON `error` message when present so the UI can show it directly.
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, headers } = {}) {
  const opts = {
    method,
    credentials: "include", // send/receive the session cookie
    headers: { ...headers },
  };

  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch {
    // Network-level failure (server down, CORS, offline, ...).
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0,
      null,
    );
  }

  // 204 / empty body guard.
  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    const message =
      (data && data.error) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Build a querystring from an object, skipping null/undefined/"" values.
export function qs(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const sp = new URLSearchParams();
  entries.forEach(([k, v]) => sp.append(k, v));
  return `?${sp.toString()}`;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path, body) => request(path, { method: "DELETE", body }),
};
