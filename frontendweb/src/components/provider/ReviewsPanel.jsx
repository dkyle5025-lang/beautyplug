import { useCallback, useEffect, useState } from "react";
import { ratings as ratingApi } from "../../api/resources.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { dateLabel } from "../../lib/format.js";
import Alert from "../Alert.jsx";
import Loader from "../Loader.jsx";
import Stars from "../Stars.jsx";

// Provider reads their reviews and posts a public response to each.
export default function ReviewsPanel() {
  const { profileId } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [drafts, setDrafts] = useState({}); // ratingId -> response text
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    ratingApi
      .list({ provider_id: profileId })
      .then(setList)
      .catch((err) => setMsg({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [profileId]);

  useEffect(load, [load]);

  async function respond(rating) {
    const text = (drafts[rating.id] || "").trim();
    if (!text) return;
    setSavingId(rating.id);
    setMsg({ type: "", text: "" });
    try {
      await ratingApi.respond(rating.id, { provider_response: text });
      setDrafts((d) => ({ ...d, [rating.id]: "" }));
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSavingId(null);
    }
  }

  if (!profileId) {
    return <Alert type="info">Create your business profile first.</Alert>;
  }

  return (
    <div>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2>What your clients say</h2>
        </div>
      </div>

      {msg.text ? (
        <Alert type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>
          {msg.text}
        </Alert>
      ) : null}

      {loading ? (
        <Loader />
      ) : list.length > 0 ? (
        <div className="review-list">
          {list.map((r) => (
            <article className="review-card" key={r.id}>
              <div className="review-head">
                <Stars value={r.rating_stars} size="sm" />
                <span className="muted-text">{dateLabel(r.created_at)}</span>
              </div>
              {r.review_text ? <p>{r.review_text}</p> : <p className="muted-text">No comment.</p>}

              {r.provider_response ? (
                <div className="provider-response">
                  <p className="eyebrow">Your response</p>
                  <p>{r.provider_response}</p>
                </div>
              ) : (
                <div className="response-form">
                  <textarea
                    rows={2}
                    placeholder="Write a public response…"
                    value={drafts[r.id] || ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                    }
                  />
                  <button
                    className="primary-button sm"
                    onClick={() => respond(r)}
                    disabled={savingId === r.id}
                  >
                    {savingId === r.id ? "Posting…" : "Respond"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-text">No reviews yet.</p>
      )}
    </div>
  );
}
