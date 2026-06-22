import { useCallback, useEffect, useState } from "react";
import { availability as availabilityApi } from "../../api/resources.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { dateLabel, timeLabel, todayISO } from "../../lib/format.js";
import Alert from "../Alert.jsx";
import Loader from "../Loader.jsx";

const EMPTY = { available_date: todayISO(), start_time: "09:00", end_time: "17:00" };

export default function AvailabilityPanel() {
  const { profileId } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    availabilityApi
      .list({ provider_id: profileId })
      .then(setList)
      .catch((err) => setMsg({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [profileId]);

  useEffect(load, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function add(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await availabilityApi.create({ ...form, provider_id: profileId });
      setForm(EMPTY);
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(slot) {
    try {
      await availabilityApi.update(slot.id, { is_available: !slot.is_available });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  async function remove(slot) {
    try {
      await availabilityApi.remove(slot.id);
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  if (!profileId) {
    return (
      <Alert type="info">Create your business profile first to set availability.</Alert>
    );
  }

  return (
    <div>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Availability</p>
          <h2>Publish open slots</h2>
        </div>
      </div>

      {msg.text ? (
        <Alert type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>
          {msg.text}
        </Alert>
      ) : null}

      <form className="stacked-form" onSubmit={add}>
        <div className="form-grid three-col">
          <label>
            <span>Date</span>
            <input
              type="date"
              min={todayISO()}
              value={form.available_date}
              onChange={set("available_date")}
              required
            />
          </label>
          <label>
            <span>Start</span>
            <input type="time" value={form.start_time} onChange={set("start_time")} required />
          </label>
          <label>
            <span>End</span>
            <input type="time" value={form.end_time} onChange={set("end_time")} required />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Adding…" : "+ Add slot"}
          </button>
        </div>
      </form>

      {loading ? (
        <Loader />
      ) : list.length > 0 ? (
        <div className="slot-list">
          {list.map((slot) => (
            <div className={`slot-row ${slot.is_available ? "" : "off"}`} key={slot.id}>
              <div>
                <strong>{dateLabel(slot.available_date)}</strong>
                <span className="muted-text">
                  {" "}
                  {timeLabel(slot.start_time)} – {timeLabel(slot.end_time)}
                </span>
              </div>
              <div className="booking-actions">
                <button className="ghost-button sm" onClick={() => toggle(slot)}>
                  {slot.is_available ? "Mark unavailable" : "Mark available"}
                </button>
                <button className="ghost-button sm danger" onClick={() => remove(slot)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted-text">No slots published yet.</p>
      )}
    </div>
  );
}
