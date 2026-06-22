import { Link } from "react-router-dom";
import { categoryLabel } from "../api/resources.js";

export default function ProviderCard({ provider }) {
  const initials = (provider.business_name || "?").trim().charAt(0).toUpperCase();
  return (
    <article className="provider-card">
      <div className="provider-card-top">
        {provider.profile_picture_url ? (
          <img
            className="provider-avatar"
            src={provider.profile_picture_url}
            alt={provider.business_name}
          />
        ) : (
          <span className="provider-avatar placeholder" aria-hidden="true">
            {initials}
          </span>
        )}
        <div>
          <h3>{provider.business_name}</h3>
          <span className="chip">{categoryLabel(provider.primary_category)}</span>
        </div>
      </div>

      {provider.bio ? (
        <p className="provider-bio">{provider.bio}</p>
      ) : (
        <p className="provider-bio muted-text">No bio provided yet.</p>
      )}

      {provider.home_location_address ? (
        <p className="provider-location">📍 {provider.home_location_address}</p>
      ) : null}

      <Link className="primary-button block" to={`/providers/${provider.id}`}>
        View &amp; book
      </Link>
    </article>
  );
}
