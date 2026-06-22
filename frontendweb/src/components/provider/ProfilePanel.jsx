import { useEffect, useState } from "react";
import {
  providers as providerApi,
  CATEGORIES,
} from "../../api/resources.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Alert from "../Alert.jsx";
import Badge from "../Badge.jsx";
import Loader from "../Loader.jsx";

const EMPTY = {
  business_name: "",
  primary_category: "barber",
  bio: "",
  profile_picture_url: "",
  home_location_address: "",
};

// Edit (or create, if missing) the provider's business profile.
export default function ProfilePanel() {
  const { profileId, refreshProfileId } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    providerApi
      .get(profileId)
      .then((p) => {
        setForm({
          business_name: p.business_name || "",
          primary_category: p.primary_category || "barber",
          bio: p.bio || "",
          profile_picture_url: p.profile_picture_url || "",
          home_location_address: p.home_location_address || "",
        });
        setApprovalStatus(p.approval_status);
      })
      .catch((err) => setMsg({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [profileId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      if (profileId) {
        await providerApi.update(profileId, form);
        setMsg({ type: "success", text: "Profile updated." });
      } else {
        await providerApi.create(form);
        await refreshProfileId();
        setMsg({
          type: "success",
          text: "Profile created. It's pending admin approval.",
        });
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Business profile</p>
          <h2>{profileId ? "Edit your profile" : "Set up your profile"}</h2>
        </div>
        {approvalStatus ? <Badge status={approvalStatus} /> : null}
      </div>

      {approvalStatus && approvalStatus !== "approved" ? (
        <Alert type="info">
          Your profile is <strong>{approvalStatus.replace(/_/g, " ")}</strong>.
          It won't appear in the public catalog until an admin approves it.
        </Alert>
      ) : null}

      {msg.text ? (
        <Alert type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>
          {msg.text}
        </Alert>
      ) : null}

      <form className="stacked-form" onSubmit={handleSubmit}>
        <div className="form-grid two-col">
          <label>
            <span>Business name</span>
            <input value={form.business_name} onChange={set("business_name")} required />
          </label>
          <label>
            <span>Primary category</span>
            <select value={form.primary_category} onChange={set("primary_category")}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="full-width">
            <span>Profile picture URL</span>
            <input
              value={form.profile_picture_url}
              onChange={set("profile_picture_url")}
              placeholder="https://…"
            />
          </label>
          <label className="full-width">
            <span>Location / address</span>
            <input
              value={form.home_location_address}
              onChange={set("home_location_address")}
            />
          </label>
          <label className="full-width">
            <span>Bio</span>
            <textarea rows={4} value={form.bio} onChange={set("bio")} />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : profileId ? "Save profile" : "Create profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
