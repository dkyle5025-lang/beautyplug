// Inline status banner. `type` controls colour: error | success | info.
export default function Alert({ type = "error", children, onClose }) {
  if (!children) return null;
  return (
    <div className={`alert-box alert-${type}`} role="alert">
      <span>{children}</span>
      {onClose ? (
        <button
          type="button"
          className="alert-close"
          aria-label="Dismiss"
          onClick={onClose}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
