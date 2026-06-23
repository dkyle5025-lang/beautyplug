import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../api/resources.js";
import Alert from "../components/Alert.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    user_type: "client",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    business_name: "",
    primary_category: "barber",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const isProvider = form.user_type === "provider";

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      email: form.email,
      phone: form.phone,
      first_name: form.first_name,
      last_name: form.last_name,
      password: form.password,
      user_type: form.user_type,
    };
    if (isProvider) {
      payload.business_name = form.business_name;
      payload.primary_category = form.primary_category;
    }

    try {
      const me = await register(payload);
      navigate(me.user_type === "provider" ? "/dashboard" : "/", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell narrow">
      <section className="panel auth-panel">
        <p className="eyebrow">Join BeautyPlug</p>
        <h1>Create your account</h1>
        <p className="section-copy">
          Book beauty services as a client, or grow your business as a provider.
        </p>

        <Alert onClose={() => setError("")}>{error}</Alert>

        <div className="role-toggle">
          <button
            type="button"
            className={!isProvider ? "role-option active" : "role-option"}
            onClick={() => setForm((f) => ({ ...f, user_type: "client" }))}
          >
            I'm a client
          </button>
          <button
            type="button"
            className={isProvider ? "role-option active" : "role-option"}
            onClick={() => setForm((f) => ({ ...f, user_type: "provider" }))}
          >
            I'm a service provider
          </button>
        </div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="form-grid two-col">
            <label>
              <span>First name</span>
              <input value={form.first_name} onChange={set("first_name")} required />
            </label>
            <label>
              <span>Last name</span>
              <input value={form.last_name} onChange={set("last_name")} required />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                required
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="+254700000000"
                required
              />
            </label>
            <label className="full-width">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            {isProvider ? (
              <>
                <label>
                  <span>Business name</span>
                  <input
                    value={form.business_name}
                    onChange={set("business_name")}
                    placeholder="Glow Studio"
                    required
                  />
                </label>
                <label>
                  <span>Primary category</span>
                  <select
                    value={form.primary_category}
                    onChange={set("primary_category")}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Sign up"}
            </button>
          </div>
        </form>

        <p className="muted-text">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
