import { useEffect, useMemo, useState } from "react";
import { providers as providerApi, CATEGORIES } from "../api/resources.js";
import ProviderCard from "../components/ProviderCard.jsx";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";

export default function Home() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    // Public catalog: only show approved providers.
    providerApi
      .list({ approval_status: "approved", category: category || undefined })
      .then((data) => active && setList(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.business_name?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.home_location_address?.toLowerCase().includes(q),
    );
  }, [list, search]);

  return (
    <main className="page-shell">
      <section className="hero-card landing-hero">
        <div>
          <p className="eyebrow">Beauty, on demand</p>
          <h1>Find and book trusted beauty professionals</h1>
          <p className="section-copy">
            Barbers, hairstylists, makeup artists, nail techs and more — browse
            approved providers, see their services and prices, and book in
            seconds.
          </p>
          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location or keyword…"
          />
        </div>
        <div className="stats-pill">
          <span className="stats-number">{list.length}</span>
          <span className="stats-label">approved providers</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>Browse by service</h2>
          </div>
        </div>
        <div className="chip-row">
          <button
            className={!category ? "filter-chip active" : "filter-chip"}
            onClick={() => setCategory("")}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={
                category === c.value ? "filter-chip active" : "filter-chip"
              }
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Providers</p>
            <h2>{category ? CATEGORIES.find((c) => c.value === category)?.label : "All providers"}</h2>
          </div>
        </div>

        <Alert onClose={() => setError("")}>{error}</Alert>

        {loading ? (
          <Loader label="Loading providers…" />
        ) : filtered.length > 0 ? (
          <div className="provider-grid">
            {filtered.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        ) : (
          <p className="muted-text">
            No providers found{category ? " in this category" : ""}
            {search ? " matching your search" : ""}.
          </p>
        )}
      </section>
    </main>
  );
}
