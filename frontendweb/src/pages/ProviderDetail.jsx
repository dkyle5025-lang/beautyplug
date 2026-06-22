import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  providers as providerApi,
  services as serviceApi,
  ratings as ratingApi,
  availability as availabilityApi,
  favorites as favoriteApi,
  categoryLabel,
} from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money, dateLabel, timeLabel, fullName } from "../lib/format.js";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";
import Stars from "../components/Stars.jsx";
import BookingModal from "../components/BookingModal.jsx";

export default function ProviderDetail() {
  const { id } = useParams();
  const { isClient, profileId } = useAuth();

  const [provider, setProvider] = useState(null);
  const [serviceList, setServiceList] = useState([]);
  const [reviewList, setReviewList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [bookingService, setBookingService] = useState(null);

  const loadFavorites = useCallback(() => {
    if (!isClient || !profileId) return;
    favoriteApi
      .list(profileId)
      .then(setFavorites)
      .catch(() => {});
  }, [isClient, profileId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      providerApi.get(id),
      serviceApi.list({ provider_id: id, is_active: "true" }),
      ratingApi.list({ provider_id: id }),
      availabilityApi.list({ provider_id: id, only_available: "1" }),
    ])
      .then(([p, s, r, a]) => {
        if (!active) return;
        setProvider(p);
        setServiceList(s);
        setReviewList(r);
        setSlots(a);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(loadFavorites, [loadFavorites]);

  const favorite = useMemo(
    () => favorites.find((f) => f.provider_id === Number(id)),
    [favorites, id],
  );

  const avgRating = useMemo(() => {
    if (reviewList.length === 0) return 0;
    const sum = reviewList.reduce((acc, r) => acc + Number(r.rating_stars), 0);
    return sum / reviewList.length;
  }, [reviewList]);

  async function toggleFavorite() {
    if (!profileId) {
      setNotice("Add your client profile id on your profile page to save favorites.");
      return;
    }
    try {
      if (favorite) {
        await favoriteApi.remove(favorite.id);
      } else {
        await favoriteApi.add(profileId, Number(id));
      }
      loadFavorites();
    } catch (err) {
      setNotice(err.message);
    }
  }

  if (loading) return <main className="page-shell"><Loader /></main>;
  if (error)
    return (
      <main className="page-shell">
        <Alert>{error}</Alert>
        <Link to="/" className="ghost-button">
          ← Back to browse
        </Link>
      </main>
    );
  if (!provider) return null;

  return (
    <main className="page-shell">
      <Link to="/" className="back-link">
        ← Back to browse
      </Link>

      <section className="hero-card provider-hero">
        <div className="provider-hero-main">
          {provider.profile_picture_url ? (
            <img
              className="provider-avatar lg"
              src={provider.profile_picture_url}
              alt={provider.business_name}
            />
          ) : (
            <span className="provider-avatar lg placeholder">
              {(provider.business_name || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className="eyebrow">{categoryLabel(provider.primary_category)}</p>
            <h1>{provider.business_name}</h1>
            <p className="section-copy">{provider.bio || "No bio provided."}</p>
            <div className="inline-meta">
              <Stars value={avgRating} />
              <span className="muted-text">
                {reviewList.length
                  ? `${avgRating.toFixed(1)} · ${reviewList.length} review${
                      reviewList.length > 1 ? "s" : ""
                    }`
                  : "No reviews yet"}
              </span>
            </div>
            {provider.home_location_address ? (
              <p className="provider-location">
                📍 {provider.home_location_address}
              </p>
            ) : null}
            <p className="muted-text">
              {fullName(provider)} · {provider.email} · {provider.phone}
            </p>
          </div>
        </div>
        {isClient ? (
          <button
            type="button"
            className={favorite ? "primary-button" : "ghost-button"}
            onClick={toggleFavorite}
          >
            {favorite ? "♥ Saved" : "♡ Save to favorites"}
          </button>
        ) : null}
      </section>

      {notice ? <Alert type="info" onClose={() => setNotice("")}>{notice}</Alert> : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Services</p>
            <h2>What we offer</h2>
          </div>
        </div>
        {serviceList.length > 0 ? (
          <div className="service-list">
            {serviceList.map((s) => (
              <article className="service-row" key={s.id}>
                <div>
                  <h3>{s.service_name}</h3>
                  <p className="muted-text">
                    {s.service_description || "—"}
                  </p>
                  <p className="service-meta">
                    {money(s.price)} · {s.duration_minutes} min
                  </p>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setBookingService(s)}
                >
                  Book
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">No active services listed.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Availability</p>
            <h2>Open slots</h2>
          </div>
        </div>
        {slots.length > 0 ? (
          <div className="slot-grid">
            {slots.map((slot) => (
              <div className="slot-pill" key={slot.id}>
                <strong>{dateLabel(slot.available_date)}</strong>
                <span>
                  {timeLabel(slot.start_time)} – {timeLabel(slot.end_time)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-text">No availability published yet.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2>What clients say</h2>
          </div>
        </div>
        {reviewList.length > 0 ? (
          <div className="review-list">
            {reviewList.map((r) => (
              <article className="review-card" key={r.id}>
                <div className="review-head">
                  <Stars value={r.rating_stars} size="sm" />
                  <span className="muted-text">{dateLabel(r.created_at)}</span>
                </div>
                {r.review_text ? <p>{r.review_text}</p> : null}
                {r.provider_response ? (
                  <div className="provider-response">
                    <p className="eyebrow">Provider response</p>
                    <p>{r.provider_response}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">No reviews yet — be the first to book.</p>
        )}
      </section>

      {bookingService ? (
        <BookingModal
          provider={provider}
          service={bookingService}
          onClose={() => setBookingService(null)}
          onBooked={() => {
            setBookingService(null);
            setNotice("Booking requested! Track it under My bookings.");
          }}
        />
      ) : null}
    </main>
  );
}
