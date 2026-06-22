// Star rating. Read-only display by default; pass `onChange` to make it an
// interactive 1–5 picker.
export default function Stars({ value = 0, onChange, size = "md" }) {
  const rounded = Math.round(Number(value) || 0);
  const interactive = typeof onChange === "function";

  return (
    <span className={`stars stars-${size}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rounded;
        const star = (
          <span className={filled ? "star filled" : "star"} aria-hidden="true">
            ★
          </span>
        );
        if (!interactive) return <span key={n}>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            className="star-button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}
