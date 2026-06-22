import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { favorites as favoriteApi, categoryLabel } from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";

export default function Favorites() {
  const { profileId } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    favoriteApi
      .list(profileId)
      .then(setList)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [profileId]);

  useEffect(load, [load]);

  async function remove(favId) {
    try {
      await favoriteApi.remove(favId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!profileId) {
    return (
      <main className="page-shell">
        <section className="panel">
          <h1>Favorites</h1>
          <Alert type="info">
            Add your client profile id on your{" "}
            <Link to="/profile">profile page</Link> to use favorites.
          </Alert>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Saved</p>
          <h1>Your favorite providers</h1>
          <p className="section-copy">Quick access to the pros you love.</p>
        </div>
        <div className="stats-pill">
          <span className="stats-number">{list.length}</span>
          <span className="stats-label">saved</span>
        </div>
      </section>

      <section className="panel">
        <Alert onClose={() => setError("")}>{error}</Alert>
        {loading ? (
          <Loader />
        ) : list.length > 0 ? (
          <div className="provider-grid">
            {list.map((f) => (
              <article className="provider-card" key={f.id}>
                <div className="provider-card-top">
                  <span className="provider-avatar placeholder">
                    {(f.business_name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3>{f.business_name}</h3>
                    <span className="chip">{categoryLabel(f.primary_category)}</span>
                  </div>
                </div>
                <div className="form-actions">
                  <Link className="primary-button" to={`/providers/${f.provider_id}`}>
                    View
                  </Link>
                  <button className="ghost-button danger" onClick={() => remove(f.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            No favorites yet. <Link to="/">Find providers</Link> to save.
          </p>
        )}
      </section>
    </main>
  );
}
