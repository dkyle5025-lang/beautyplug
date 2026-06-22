// Small display helpers shared across pages.

// Money comes back from the API as a DECIMAL string (e.g. "25.00").
export function money(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `KSh ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Dates arrive as ISO strings (service_date) — show just the calendar date.
export function dateLabel(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Times arrive as "HH:MM:SS" — trim to "HH:MM".
export function timeLabel(value) {
  if (!value) return "—";
  return String(value).slice(0, 5);
}

// Today's date as YYYY-MM-DD, for date input `min` attributes.
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function fullName(u) {
  if (!u) return "—";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
}
