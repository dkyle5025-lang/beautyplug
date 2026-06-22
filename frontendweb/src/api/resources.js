// Thin, named wrappers around every BeautyPlug API endpoint, grouped by
// resource. Components call these instead of building paths by hand.
import { api, qs } from "./client.js";

export const auth = {
  register: (payload) => api.post("/auth/register", payload),
  login: (email, password) => api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const users = {
  list: () => api.get("/users"),
  get: (id) => api.get(`/users/${id}`),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.del(`/users/${id}`),
};

export const providers = {
  list: (filters) => api.get(`/service-providers${qs(filters)}`),
  get: (id) => api.get(`/service-providers/${id}`),
  create: (payload) => api.post("/service-providers", payload),
  update: (id, payload) => api.put(`/service-providers/${id}`, payload),
  setApproval: (id, payload) =>
    api.put(`/service-providers/${id}/approval`, payload),
  remove: (id) => api.del(`/service-providers/${id}`),
};

export const services = {
  list: (filters) => api.get(`/services${qs(filters)}`),
  get: (id) => api.get(`/services/${id}`),
  create: (payload) => api.post("/services", payload),
  update: (id, payload) => api.put(`/services/${id}`, payload),
  remove: (id) => api.del(`/services/${id}`),
};

export const clients = {
  list: () => api.get("/clients"),
  get: (id) => api.get(`/clients/${id}`),
  update: (id, payload) => api.put(`/clients/${id}`, payload),
};

export const bookings = {
  list: (filters) => api.get(`/bookings${qs(filters)}`),
  get: (id) => api.get(`/bookings/${id}`),
  create: (payload) => api.post("/bookings", payload),
  setStatus: (id, payload) => api.put(`/bookings/${id}/status`, payload),
  cancel: (id, payload) => api.del(`/bookings/${id}`, payload),
};

export const ratings = {
  list: (filters) => api.get(`/ratings${qs(filters)}`),
  create: (payload) => api.post("/ratings", payload),
  respond: (id, payload) => api.put(`/ratings/${id}/response`, payload),
};

export const availability = {
  list: (filters) => api.get(`/availability${qs(filters)}`),
  create: (payload) => api.post("/availability", payload),
  update: (id, payload) => api.put(`/availability/${id}`, payload),
  remove: (id) => api.del(`/availability/${id}`),
};

export const favorites = {
  list: (clientId) => api.get(`/favorites${qs({ client_id: clientId })}`),
  add: (clientId, providerId) =>
    api.post("/favorites", { client_id: clientId, provider_id: providerId }),
  remove: (id) => api.del(`/favorites/${id}`),
};

// ---------------------------------------------------------------------------
// Shared enums / labels (mirror the SQL schema). Kept here so dropdowns and
// badges stay consistent across pages.
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { value: "barber", label: "Barber" },
  { value: "hairstylist", label: "Hairstylist" },
  { value: "manicure", label: "Manicure" },
  { value: "pedicure", label: "Pedicure" },
  { value: "massage", label: "Massage" },
  { value: "skincare", label: "Skincare" },
  { value: "makeup", label: "Makeup" },
  { value: "waxing", label: "Waxing" },
  { value: "nail_art", label: "Nail art" },
  { value: "other", label: "Other" },
];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || value || "—";

export const BOOKING_STATUSES = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export const APPROVAL_STATUSES = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "suspended",
];
