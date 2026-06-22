import { useState } from "react";
import { ratings as ratingApi } from "../api/resources.js";
import Modal from "./Modal.jsx";
import Alert from "./Alert.jsx";
import Stars from "./Stars.jsx";

// Leave a review for a completed booking. The API enforces one rating per
// booking (booking_id is unique).
export default function RatingModal({ booking, onClose, onRated }) {
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [detail, setDetail] = useState({
    cleanliness_rating: 0,
    professionalism_rating: 0,
    punctuality_rating: 0,
    quality_rating: 0,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await ratingApi.create({
        booking_id: booking.id,
        client_id: booking.client_id,
        provider_id: booking.provider_id,
        rating_stars: stars,
        review_text: reviewText || undefined,
        cleanliness_rating: detail.cleanliness_rating || undefined,
        professionalism_rating: detail.professionalism_rating || undefined,
        punctuality_rating: detail.punctuality_rating || undefined,
        quality_rating: detail.quality_rating || undefined,
      });
      onRated?.();
    } catch (err) {
      setError(err.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  const detailRow = (key, label) => (
    <div className="rating-detail-row">
      <span>{label}</span>
      <Stars
        size="sm"
        value={detail[key]}
        onChange={(n) => setDetail((d) => ({ ...d, [key]: n }))}
      />
    </div>
  );

  return (
    <Modal eyebrow="Leave a review" title="How was your experience?" onClose={onClose}>
      <Alert onClose={() => setError("")}>{error}</Alert>
      <form className="stacked-form" onSubmit={handleSubmit}>
        <div className="overall-rating">
          <span className="eyebrow">Overall rating</span>
          <Stars value={stars} onChange={setStars} size="lg" />
        </div>

        <div className="rating-details">
          {detailRow("cleanliness_rating", "Cleanliness")}
          {detailRow("professionalism_rating", "Professionalism")}
          {detailRow("punctuality_rating", "Punctuality")}
          {detailRow("quality_rating", "Quality")}
        </div>

        <label>
          <span>Your review (optional)</span>
          <textarea
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell others about your visit…"
          />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit review"}
          </button>
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
