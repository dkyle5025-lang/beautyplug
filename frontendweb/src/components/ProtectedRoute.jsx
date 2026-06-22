import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

// Guards a route. Redirects to /login when unauthenticated, or home when the
// user's role is not in `roles` (when provided).
export default function ProtectedRoute({ roles, children }) {
  const { isAuthed, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session…" />;

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.user_type)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
