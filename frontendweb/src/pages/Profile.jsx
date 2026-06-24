import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  users as userApi,
  clients as clientApi,
} from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";
import Alert from "../components/Alert.jsx";

export default function Profile() {
  const {
    user,
    setUser,
    isClient,
    isProvider,
    profileId,
    setClientProfileId,
    refreshProfileId,
  } = useAuth();

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

  // Saving the profile is what establishes the client id: resolve it first
  // (the API has no user→client lookup), then persist the optional bio/picture.
  async function saveClientProfile(e) {
    e.preventDefault();
    setSavingClient(true);
    setClientMsg({ type: "", text: "" });
    try {
      let id = profileId;
      if (!id) id = await refreshProfileId();
      if (!id) {
        setClientMsg({
          type: "error",
          text: "We couldn't find your client profile. Enter its id manually below, then save.",
        });
        return;
      }
      await clientApi.update(id, clientProfile);
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
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Client profile</p>
              <h2>Your profile</h2>
            </div>
            {profileId ? (
              <span className="status-pill active">Active · #{profileId}</span>
            ) : (
              <span className="status-pill pending">Setup required</span>
            )}
          </div>
          <p className="section-copy">
            Add a profile picture or a short bio — both optional. Saving your
            profile activates your client account so you can book, favorite and
            review.
          </p>
          {clientMsg.text ? (
            <Alert type={clientMsg.type} onClose={() => setClientMsg({ type: "", text: "" })}>
              {clientMsg.text}
            </Alert>
          ) : null}
          <form className="stacked-form" onSubmit={saveClientProfile}>
            <label>
              <span>Profile picture URL (optional)</span>
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
              <span>Bio (optional)</span>
              <textarea
                rows={3}
                value={clientProfile.bio}
                onChange={(e) =>
                  setClientProfile((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="Tell providers a little about yourself"
              />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={savingClient}>
                {savingClient
                  ? "Saving…"
                  : profileId
                    ? "Save profile"
                    : "Save & activate profile"}
              </button>
            </div>
          </form>

          {!profileId ? (
            <details className="manual-link">
              <summary>Profile not found? Enter your client id manually</summary>
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
                    {linking ? "Verifying…" : "Link profile"}
                  </button>
                </div>
              </form>
            </details>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
