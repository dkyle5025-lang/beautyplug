import { useEffect, useState } from "react";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editUserType, setEditUserType] = useState("client");

  async function fetchUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/users");
      const data = await response.json();
      setUsers(data);
    } catch (fetchError) {
      setError("Unable to load users right now.");
      console.error(fetchError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function resetCreateForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
  }

  function openEditModal(user) {
    setEditingUser(user);
    setEditFirstName(user.first_name ?? "");
    setEditLastName(user.last_name ?? "");
    setEditEmail(user.email ?? "");
    setEditPhone(user.phone ?? "");
    setEditUserType(user.user_type ?? "client");
  }

  function closeEditModal() {
    setEditingUser(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          first_name: firstName,
          last_name: lastName,
          user_type: "client",
          password_hash: "beautyplug-temp-password",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user.");
      }

      resetCreateForm();
      await fetchUsers();
    } catch (submitError) {
      setError("Unable to add user right now.");
      console.error(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingUser) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3000/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: editEmail,
            phone: editPhone,
            first_name: editFirstName,
            last_name: editLastName,
            user_type: editUserType,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update user.");
      }

      closeEditModal();
      await fetchUsers();
    } catch (updateError) {
      setError("Unable to update user right now.");
      console.error(updateError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell users-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">People management</p>
          <h1>Users</h1>
          <p className="section-copy">
            Add new users, review the current roster, and edit details in a
            focused modal without leaving the page.
          </p>
        </div>
        <div className="stats-pill">
          <span className="stats-number">{users.length}</span>
          <span className="stats-label">total users</span>
        </div>
      </section>

      <section className="panel grid-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Create user</p>
            <h2>Add a client account</h2>
          </div>
        </div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="form-grid two-col">
            <label>
              <span>First name</span>
              <input
                type="text"
                name="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Amina"
                required
              />
            </label>
            <label>
              <span>Last name</span>
              <input
                type="text"
                name="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Owens"
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amina@example.com"
                required
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                type="text"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create user"}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={resetCreateForm}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Directory</p>
            <h2>Users list</h2>
          </div>
          <button className="ghost-button" type="button" onClick={fetchUsers}>
            Refresh
          </button>
        </div>

        {error ? <p className="alert-box">{error}</p> : null}

        {loading ? (
          <p className="muted-text">Loading users...</p>
        ) : users.length > 0 ? (
          <div className="user-grid">
            {users.map((user) => (
              <article className="user-card" key={user.id ?? user.email}>
                <div className="user-card-head">
                  <div>
                    <h3>
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="user-meta">{user.user_type}</p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => openEditModal(user)}
                  >
                    Edit
                  </button>
                </div>

                <dl className="user-details">
                  <div>
                    <dt>Email</dt>
                    <dd>{user.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{user.phone}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">No users found.</p>
        )}
      </section>

      {editingUser ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={closeEditModal}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit user</p>
                <h2 id="edit-user-title">
                  {editingUser.first_name} {editingUser.last_name}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={closeEditModal}
              >
                Close
              </button>
            </div>

            <form className="stacked-form" onSubmit={handleUpdate}>
              <div className="form-grid two-col">
                <label>
                  <span>First name</span>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Last name</span>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                  />
                </label>
                <label className="full-width">
                  <span>User type</span>
                  <select
                    value={editUserType}
                    onChange={(e) => setEditUserType(e.target.value)}
                  >
                    <option value="client">Client</option>
                    <option value="provider">Provider</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Save changes"}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default Users;
