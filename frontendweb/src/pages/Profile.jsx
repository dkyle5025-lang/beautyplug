import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  users as userApi,
  clients as clientApi,
} from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";
import Alert from "../components/Alert.jsx";

export default function Profile() {
  const { user, setUser, isClient, isProvider, profileId, setClientProfileId } =
    useAuth();

  const [account, setAccount] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
  });
  const [accountMsg, setAccountMsg] = useState({ type: "", text: "" });
  const [savingAccount, setSavingAccount] = useState(false);

  // Client profile-id linking (the API has no user→client lookup).
  const [clientIdInput, setClientIdInput] = useState(profileId || "");
  const [linkMsg, setLinkMsg] = useState({ type: "", text: "" });
  const [linking, setLinking] = useState(false);

  // Client bio / picture editing (PUT /clients/:id).
  const [clientProfile, setClientProfile] = useState({ bio: "", profile_picture_url: "" });
  const [savingClient, setSavingClient] = useState(false);
  const [clientMsg, setClientMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isClient && profileId) {
      clientApi
        .get(profileId)
        .then((c) =>
          setClientProfile({
            bio: c.bio || "",
            profile_picture_url: c.profile_picture_url || "",
          }),
        )
        .catch(() => {});
    }
  }, [isClient, profileId]);

  const setAcc = (key) => (e) =>
    setAccount((a) => ({ ...a, [key]: e.target.value }));

  async function saveAccount(e) {
    e.preventDefault();
    setSavingAccount(true);
    setAccountMsg({ type: "", text: "" });
    try {
      const updated = await userApi.update(user.id, account);
      setUser((u) => ({ ...u, ...updated }));
      setAccountMsg({ type: "success", text: "Account updated." });
    } catch (err) {
      setAccountMsg({ type: "error", text: err.message });
    } finally {
      setSavingAccount(false);
    }
  }

  async function linkClient(e) {
    e.preventDefault();
    setLinking(true);
    setLinkMsg({ type: "", text: "" });
    try {
      // Verify the entered client profile actually belongs to this user.
      const c = await clientApi.get(Number(clientIdInput));
      if (c.user_id !== user.id) {
        setLinkMsg({
          type: "error",
          text: "That client profile belongs to a different account.",
        });
      } else {
        setClientProfileId(Number(clientIdInput));
        setLinkMsg({ type: "success", text: "Client profile linked!" });
      }
    } catch (err) {
      setLinkMsg({
        type: "error",
        text:
          err.status === 404
            ? "No client profile with that id."
            : err.message,
      });
    } finally {
      setLinking(false);
    }
  }

  async function saveClientProfile(e) {
    e.preventDefault();
    setSavingClient(true);
    setClientMsg({ type: "", text: "" });
    try {
      await clientApi.update(profileId, clientProfile);
      setClientMsg({ type: "success", text: "Profile saved." });
    } catch (err) {
      setClientMsg({ type: "error", text: err.message });
    } finally {
      setSavingClient(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Your profile</h1>
          <p className="section-copy">
            Signed in as {user.email} · role: {user.user_type}
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Account details</p>
            <h2>Edit your information</h2>
          </div>
        </div>
        {accountMsg.text ? (
          <Alert type={accountMsg.type} onClose={() => setAccountMsg({ type: "", text: "" })}>
            {accountMsg.text}
          </Alert>
        ) : null}
        <form className="stacked-form" onSubmit={saveAccount}>
          <div className="form-grid two-col">
            <label>
              <span>First name</span>
              <input value={account.first_name} onChange={setAcc("first_name")} required />
            </label>
            <label>
              <span>Last name</span>
              <input value={account.last_name} onChange={setAcc("last_name")} required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={account.email} onChange={setAcc("email")} required />
            </label>
            <label>
              <span>Phone</span>
              <input value={account.phone} onChange={setAcc("phone")} required />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={savingAccount}>
              {savingAccount ? "Saving…" : "Save account"}
            </button>
          </div>
        </form>
      </section>

      {isProvider ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Provider</p>
              <h2>Business profile</h2>
            </div>
          </div>
          <p className="section-copy">
            Manage your business details, services and availability from your{" "}
            <Link to="/dashboard">provider dashboard</Link>.
          </p>
        </section>
      ) : null}

      {isClient ? (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Client profile</p>
                <h2>Link your client id</h2>
              </div>
            </div>
            <p className="section-copy">
              Bookings, favorites and reviews are tied to your client profile id
              (<code>clients.id</code>). Enter it once to enable those features.
              If you don't know it, ask an admin.
            </p>
            {linkMsg.text ? (
              <Alert type={linkMsg.type} onClose={() => setLinkMsg({ type: "", text: "" })}>
                {linkMsg.text}
              </Alert>
            ) : null}
            <form className="stacked-form" onSubmit={linkClient}>
              <div className="form-grid two-col">
                <label>
                  <span>Client profile id</span>
                  <input
                    type="number"
                    min="1"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="e.g. 1"
                    required
                  />
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={linking}>
                  {linking ? "Verifying…" : profileId ? "Update link" : "Link profile"}
                </button>
                {profileId ? (
                  <span className="muted-text">Currently linked: #{profileId}</span>
                ) : null}
              </div>
            </form>
          </section>

          {profileId ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Client profile</p>
                  <h2>Bio &amp; photo</h2>
                </div>
              </div>
              {clientMsg.text ? (
                <Alert type={clientMsg.type} onClose={() => setClientMsg({ type: "", text: "" })}>
                  {clientMsg.text}
                </Alert>
              ) : null}
              <form className="stacked-form" onSubmit={saveClientProfile}>
                <label>
                  <span>Profile picture URL</span>
                  <input
                    value={clientProfile.profile_picture_url}
                    onChange={(e) =>
                      setClientProfile((p) => ({
                        ...p,
                        profile_picture_url: e.target.value,
                      }))
                    }
                    placeholder="https://…"
                  />
                </label>
                <label>
                  <span>Bio</span>
                  <textarea
                    rows={3}
                    value={clientProfile.bio}
                    onChange={(e) =>
                      setClientProfile((p) => ({ ...p, bio: e.target.value }))
                    }
                  />
                </label>
                <div className="form-actions">
                  <button className="primary-button" type="submit" disabled={savingClient}>
                    {savingClient ? "Saving…" : "Save profile"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
