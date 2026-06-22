// Coloured status pill. Maps known booking/approval statuses to a tone class.
const TONE = {
  // bookings
  requested: "warn",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
  no_show: "danger",
  // approvals
  pending: "warn",
  under_review: "info",
  approved: "success",
  rejected: "danger",
  suspended: "danger",
};

export default function Badge({ status }) {
  const tone = TONE[status] || "neutral";
  const label = String(status || "").replace(/_/g, " ");
  return <span className={`badge badge-${tone}`}>{label}</span>;
}
