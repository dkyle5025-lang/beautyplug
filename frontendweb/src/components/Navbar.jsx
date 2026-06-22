import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { isAuthed, user, isClient, isProvider, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  const close = () => setOpen(false);

  return (
    <header className="topbar">
      <NavLink to="/" className="brand" onClick={close}>
        <p className="eyebrow">BeautyPlug</p>
        <span className="brand-title">Beauty services marketplace</span>
      </NavLink>

      <button
        className="nav-toggle icon-button"
        type="button"
        aria-expanded={open}
        aria-label="Toggle navigation"
        onClick={() => setOpen((o) => !o)}
      >
        Menu
      </button>

      <nav className={`nav-bar ${open ? "open" : ""}`}>
        <NavLink to="/" end onClick={close}>
          Browse
        </NavLink>

        {isClient ? (
          <>
            <NavLink to="/bookings" onClick={close}>
              My bookings
            </NavLink>
            <NavLink to="/favorites" onClick={close}>
              Favorites
            </NavLink>
          </>
        ) : null}

        {isProvider ? (
          <NavLink to="/dashboard" onClick={close}>
            Dashboard
          </NavLink>
        ) : null}

        {isAdmin ? (
          <>
            <NavLink to="/admin/users" onClick={close}>
              Users
            </NavLink>
            <NavLink to="/admin/providers" onClick={close}>
              Approvals
            </NavLink>
            <NavLink to="/admin/bookings" onClick={close}>
              Bookings
            </NavLink>
          </>
        ) : null}

        {isAuthed ? (
          <>
            <NavLink to="/profile" onClick={close}>
              {user.first_name || "Profile"}
            </NavLink>
            <button
              type="button"
              className="ghost-button nav-logout"
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={close}>
              Log in
            </NavLink>
            <NavLink to="/register" className="nav-cta" onClick={close}>
              Sign up
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
