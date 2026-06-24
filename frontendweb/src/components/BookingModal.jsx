import { useState } from "react";
import { Link } from "react-router-dom";
import { bookings as bookingApi } from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money, todayISO } from "../lib/format.js";
import Modal from "./Modal.jsx";
import Alert from "./Alert.jsx";

// Booking form for a single service. Requires the logged-in client's profile id
// (clients.id) which the API derives bookings from. If it's not set yet we
// point the user to their profile page to record it.
export default function BookingModal({ provider, service, onClose, onBooked }) {
  const { profileId, isClient } = useAuth();
  const [form, setForm] = useState({
    service_date: todayISO(),
    start_time: "10:00",
    service_location_address: provider.home_location_address || "",
    is_at_provider_location: true,
    client_notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await bookingApi.create({
        client_id: profileId,
        service_id: service.id,
        service_date: form.service_date,
        start_time: form.start_time,
        service_location_address: form.service_location_address,
        is_at_provider_location: form.is_at_provider_location,
        client_notes: form.client_notes || undefined,
      });
      onBooked?.();
    } catch (err) {
      setError(err.message || "Could not create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      eyebrow={`Book with ${provider.business_name}`}
      title={service.service_name}
      onClose={onClose}
    >
      <p className="section-copy">
        {money(service.price)} · {service.duration_minutes} min
      </p>

      {!isClient ? (
        <Alert type="info">Only client accounts can place bookings.</Alert>
      ) : !profileId ? (
        <Alert type="info">
          Activate your client profile before booking. Set it up on your{" "}
          <Link to="/profile">profile page</Link>, then come back.
        </Alert>
      ) : (
        <>
          <Alert onClose={() => setError("")}>{error}</Alert>
          <form className="stacked-form" onSubmit={handleSubmit}>
            <div className="form-grid two-col">
              <label>
                <span>Date</span>
                <input
                  type="date"
                  min={todayISO()}
                  value={form.service_date}
                  onChange={set("service_date")}
                  required
                />
              </label>
              <label>
                <span>Start time</span>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={set("start_time")}
                  required
                />
              </label>
              <label className="full-width">
                <span>Service location</span>
                <input
                  value={form.service_location_address}
                  onChange={set("service_location_address")}
                  placeholder="Where should the service happen?"
                  required
                />
              </label>
              <label className="full-width checkbox-row">
                <input
                  type="checkbox"
                  checked={form.is_at_provider_location}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_at_provider_location: e.target.checked,
                    }))
                  }
                />
                <span>This takes place at the provider's location</span>
              </label>
              <label className="full-width">
                <span>Notes for the provider (optional)</span>
                <textarea
                  rows={3}
                  value={form.client_notes}
                  onChange={set("client_notes")}
                  placeholder="Anything they should know?"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Booking…" : `Confirm booking · ${money(service.price)}`}
              </button>
              <button className="ghost-button" type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
