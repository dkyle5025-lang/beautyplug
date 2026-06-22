import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ProfilePanel from "../components/provider/ProfilePanel.jsx";
import ServicesPanel from "../components/provider/ServicesPanel.jsx";
import AvailabilityPanel from "../components/provider/AvailabilityPanel.jsx";
import ProviderBookingsPanel from "../components/provider/ProviderBookingsPanel.jsx";
import ReviewsPanel from "../components/provider/ReviewsPanel.jsx";

const TABS = [
  { key: "bookings", label: "Bookings", Component: ProviderBookingsPanel },
  { key: "services", label: "Services", Component: ServicesPanel },
  { key: "availability", label: "Availability", Component: AvailabilityPanel },
  { key: "reviews", label: "Reviews", Component: ReviewsPanel },
  { key: "profile", label: "Profile", Component: ProfilePanel },
];

export default function Dashboard() {
  const { user, profileId } = useAuth();
  // Without a profile yet, land on the Profile tab so they can create one.
  const [active, setActive] = useState(profileId ? "bookings" : "profile");
  const Active = TABS.find((t) => t.key === active)?.Component || ProfilePanel;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Provider dashboard</p>
          <h1>Welcome, {user.first_name}</h1>
          <p className="section-copy">
            Manage your bookings, services, availability and reviews.
          </p>
        </div>
      </section>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={active === t.key ? "tab active" : "tab"}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        <Active />
      </section>
    </main>
  );
}
