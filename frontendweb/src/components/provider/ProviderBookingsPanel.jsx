import { useCallback, useEffect, useState } from "react";
import {
  bookings as bookingApi,
  services as serviceApi,
  BOOKING_STATUSES,
} from "../../api/resources.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { money, dateLabel, timeLabel } from "../../lib/format.js";
import Alert from "../Alert.jsx";
import Loader from "../Loader.jsx";
import Badge from "../Badge.jsx";

// Provider-side booking management: confirm / complete / mark no-show / cancel.
export default function ProviderBookingsPanel() {
  const { profileId } = useAuth();
  const [list, setList] = useState([]);
  const [serviceMap, setServiceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      bookingApi.list({ provider_id: profileId, status: statusFilter || undefined }),
      serviceApi.list({ provider_id: profileId }),
    ])
      .then(([bks, svcs]) => {
        setList(bks);
        setServiceMap(Object.fromEntries(svcs.map((s) => [s.id, s])));
      })
      .catch((err) => setMsg({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [profileId, statusFilter]);

  useEffect(load, [load]);

  async function setStatus(b, status) {
    try {
      await bookingApi.setStatus(b.id, { booking_status: status });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  async function cancel(b) {
    const reason = window.prompt("Reason for cancelling? (optional)") ?? undefined;
    try {
      await bookingApi.cancel(b.id, { cancellation_reason: reason });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  if (!profileId) {
    return <Alert type="info">Create your business profile first.</Alert>;
  }

  const actionsFor = (b) => {
    switch (b.booking_status) {
      case "requested":
        return (
          <>
            <button className="primary-button sm" onClick={() => setStatus(b, "confirmed")}>
              Confirm
            </button>
            <button className="ghost-button sm danger" onClick={() => cancel(b)}>
              Decline
            </button>
          </>
        );
      case "confirmed":
        return (
          <>
            <button className="primary-button sm" onClick={() => setStatus(b, "completed")}>
              Mark completed
            </button>
            <button className="ghost-button sm" onClick={() => setStatus(b, "no_show")}>
              No-show
            </button>
            <button className="ghost-button sm danger" onClick={() => cancel(b)}>
              Cancel
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="panel-header">
        <div className="chip-row">
          <button
            className={!statusFilter ? "filter-chip active" : "filter-chip"}
            onClick={() => setStatusFilter("")}
          >
            All
          </button>
          {BOOKING_STATUSES.map((s) => (
            <button
              key={s}
              className={statusFilter === s ? "filter-chip active" : "filter-chip"}
              onClick={() => setStatusFilter(s)}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button className="ghost-button" onClick={load}>
          Refresh
        </button>
      </div>

      {msg.text ? (
        <Alert type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>
          {msg.text}
        </Alert>
      ) : null}

      {loading ? (
        <Loader />
      ) : list.length > 0 ? (
        <div className="booking-list">
          {list.map((b) => (
            <article className="booking-card" key={b.id}>
              <div className="booking-main">
                <h3>{serviceMap[b.service_id]?.service_name || `Service #${b.service_id}`}</h3>
                <p className="service-meta">
                  {dateLabel(b.service_date)} · {timeLabel(b.start_time)}–
                  {timeLabel(b.end_time)}
                </p>
                <p className="muted-text">📍 {b.service_location_address}</p>
                {b.client_notes ? (
                  <p className="muted-text">📝 {b.client_notes}</p>
                ) : null}
              </div>
              <div className="booking-side">
                <Badge status={b.booking_status} />
                <span className="price-tag">{money(b.provider_earnings)}</span>
                <span className="muted-text sm">you earn (net)</span>
                <div className="booking-actions">{actionsFor(b)}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-text">No bookings yet.</p>
      )}
    </div>
  );
}
