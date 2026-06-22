import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  bookings as bookingApi,
  ratings as ratingApi,
  BOOKING_STATUSES,
} from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money, dateLabel, timeLabel } from "../lib/format.js";
import useLookups from "../lib/useLookups.js";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";
import Badge from "../components/Badge.jsx";
import RatingModal from "../components/RatingModal.jsx";

// Client-facing "My bookings": view bookings, cancel upcoming ones, and review
// completed ones.
export default function Bookings() {
  const { profileId } = useAuth();
  const lookups = useLookups();

  const [list, setList] = useState([]);
  const [ratedIds, setRatedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rating, setRating] = useState(null);

  const load = useCallback(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      bookingApi.list({ client_id: profileId, status: statusFilter || undefined }),
      ratingApi.list({ client_id: profileId }),
    ])
      .then(([bks, rts]) => {
        setList(bks);
        setRatedIds(new Set(rts.map((r) => r.booking_id)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [profileId, statusFilter]);

  useEffect(load, [load]);

  async function cancel(booking) {
    const reason = window.prompt("Reason for cancelling? (optional)") ?? undefined;
    try {
      await bookingApi.cancel(booking.id, { cancellation_reason: reason });
      setNotice("Booking cancelled.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!profileId) {
    return (
      <main className="page-shell">
        <section className="panel">
          <h1>My bookings</h1>
          <Alert type="info">
            We need your client profile id to load your bookings. Add it on your{" "}
            <Link to="/profile">profile page</Link>.
          </Alert>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Appointments</p>
          <h1>My bookings</h1>
          <p className="section-copy">
            Track requests, upcoming visits and past appointments.
          </p>
        </div>
        <div className="stats-pill">
          <span className="stats-number">{list.length}</span>
          <span className="stats-label">bookings</span>
        </div>
      </section>

      <section className="panel">
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

        {notice ? <Alert type="success" onClose={() => setNotice("")}>{notice}</Alert> : null}
        <Alert onClose={() => setError("")}>{error}</Alert>

        {loading || !lookups.ready ? (
          <Loader label="Loading bookings…" />
        ) : list.length > 0 ? (
          <div className="booking-list">
            {list.map((b) => {
              const cancellable = ["requested", "confirmed"].includes(
                b.booking_status,
              );
              const reviewable =
                b.booking_status === "completed" && !ratedIds.has(b.id);
              return (
                <article className="booking-card" key={b.id}>
                  <div className="booking-main">
                    <h3>{lookups.serviceName(b.service_id)}</h3>
                    <p className="muted-text">
                      with {lookups.providerName(b.provider_id)}
                    </p>
                    <p className="service-meta">
                      {dateLabel(b.service_date)} · {timeLabel(b.start_time)}–
                      {timeLabel(b.end_time)}
                    </p>
                    <p className="muted-text">📍 {b.service_location_address}</p>
                  </div>
                  <div className="booking-side">
                    <Badge status={b.booking_status} />
                    <span className="price-tag">{money(b.service_price)}</span>
                    <div className="booking-actions">
                      {reviewable ? (
                        <button
                          className="primary-button sm"
                          onClick={() => setRating(b)}
                        >
                          Leave review
                        </button>
                      ) : null}
                      {ratedIds.has(b.id) ? (
                        <span className="muted-text sm">Reviewed ✓</span>
                      ) : null}
                      {cancellable ? (
                        <button
                          className="ghost-button sm danger"
                          onClick={() => cancel(b)}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted-text">
            No bookings yet. <Link to="/">Browse providers</Link> to get started.
          </p>
        )}
      </section>

      {rating ? (
        <RatingModal
          booking={rating}
          onClose={() => setRating(null)}
          onRated={() => {
            setRating(null);
            setNotice("Thanks for your review!");
            load();
          }}
        />
      ) : null}
    </main>
  );
}
