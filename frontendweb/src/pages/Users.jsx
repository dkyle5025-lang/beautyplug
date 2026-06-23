import { useEffect, useState } from "react";
import { users as userApi } from "../api/resources.js";
import Alert from "../components/Alert.jsx";
import Loader from "../components/Loader.jsx";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await userApi.list();
      setUsers(data);
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load users right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openEditModal(user) {
    setEditingUser(user);
    setEditFirstName(user.first_name ?? "");
    setEditLastName(user.last_name ?? "");
    setEditEmail(user.email ?? "");
    setEditPhone(user.phone ?? "");
  }

  function closeEditModal() {
    setEditingUser(null);
    setError("");
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setError("");
    try {
      const updated = await userApi.update(editingUser.id, {
        email: editEmail,
        phone: editPhone,
        first_name: editFirstName,
        last_name: editLastName,
      });
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );
      closeEditModal();
    } catch (updateError) {
      setError(updateError.message || "Unable to update user right now.");
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
            Review registered accounts and update contact information.
          </p>
        </div>
        <div className="stats-pill">
          <span className="stats-number">{users.length}</span>
          <span className="stats-label">total users</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Directory</p>
            <h2>Registered users</h2>
          </div>
          <button className="ghost-button" type="button" onClick={fetchUsers}>
            Refresh
          </button>
        </div>

        {error ? (
          <Alert type="error" onClose={() => setError("")}>{error}</Alert>
        ) : null}

        {loading ? (
          <Loader />
        ) : users.length > 0 ? (
          <div className="user-grid">
            {users.map((user) => (
              <article className="user-card" key={user.id}>
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
        <div className="modal-overlay" role="presentation" onClick={closeEditModal}>
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
              <button className="icon-button" type="button" onClick={closeEditModal}>
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
              </div>

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Updating..." : "Save changes"}
                </button>
                <button className="ghost-button" type="button" onClick={closeEditModal}>
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
