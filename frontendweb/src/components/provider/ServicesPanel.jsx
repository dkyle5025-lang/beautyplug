import { useCallback, useEffect, useState } from "react";
import { services as serviceApi } from "../../api/resources.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { money } from "../../lib/format.js";
import Alert from "../Alert.jsx";
import Loader from "../Loader.jsx";
import Modal from "../Modal.jsx";

const EMPTY = {
  service_name: "",
  service_description: "",
  price: "",
  duration_minutes: "",
  is_active: true,
};

export default function ServicesPanel() {
  const { profileId } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [editing, setEditing] = useState(null); // service object or {} for new
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    serviceApi
      .list({ provider_id: profileId })
      .then(setList)
      .catch((err) => setMsg({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [profileId]);

  useEffect(load, [load]);

  function openNew() {
    setForm(EMPTY);
    setEditing({});
  }
  function openEdit(s) {
    setForm({
      service_name: s.service_name,
      service_description: s.service_description || "",
      price: s.price,
      duration_minutes: s.duration_minutes,
      is_active: !!s.is_active,
    });
    setEditing(s);
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    const payload = {
      service_name: form.service_name,
      service_description: form.service_description || undefined,
      price: Number(form.price),
      duration_minutes: Number(form.duration_minutes),
      is_active: form.is_active,
    };
    try {
      if (editing.id) {
        await serviceApi.update(editing.id, payload);
      } else {
        await serviceApi.create({ ...payload, provider_id: profileId });
      }
      setEditing(null);
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(s) {
    if (!window.confirm(`Delete "${s.service_name}"?`)) return;
    try {
      await serviceApi.remove(s.id);
      load();
    } catch (err) {
      // FK restriction → suggest deactivation instead.
      setMsg({ type: "error", text: err.message });
    }
  }

  async function toggleActive(s) {
    try {
      await serviceApi.update(s.id, { is_active: !s.is_active });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  }

  if (!profileId) {
    return (
      <Alert type="info">Create your business profile first to add services.</Alert>
    );
  }

  return (
    <div>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Services</p>
          <h2>Your service menu</h2>
        </div>
        <button className="primary-button" onClick={openNew}>
          + Add service
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
        <div className="service-list">
          {list.map((s) => (
            <article className="service-row" key={s.id}>
              <div>
                <h3>
                  {s.service_name}{" "}
                  {!s.is_active ? <span className="chip muted">inactive</span> : null}
                </h3>
                <p className="muted-text">{s.service_description || "—"}</p>
                <p className="service-meta">
                  {money(s.price)} · {s.duration_minutes} min
                </p>
              </div>
              <div className="booking-actions">
                <button className="ghost-button sm" onClick={() => openEdit(s)}>
                  Edit
                </button>
                <button className="ghost-button sm" onClick={() => toggleActive(s)}>
                  {s.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="ghost-button sm danger" onClick={() => remove(s)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-text">No services yet. Add your first one.</p>
      )}

      {editing ? (
        <Modal
          eyebrow="Service"
          title={editing.id ? "Edit service" : "New service"}
          onClose={() => setEditing(null)}
        >
          <form className="stacked-form" onSubmit={save}>
            <label>
              <span>Service name</span>
              <input value={form.service_name} onChange={set("service_name")} required />
            </label>
            <label>
              <span>Description</span>
              <textarea
                rows={3}
                value={form.service_description}
                onChange={set("service_description")}
              />
            </label>
            <div className="form-grid two-col">
              <label>
                <span>Price (KSh)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={set("price")}
                  required
                />
              </label>
              <label>
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={set("duration_minutes")}
                  required
                />
              </label>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
              <span>Active (bookable)</span>
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save service"}
              </button>
              <button className="ghost-button" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
