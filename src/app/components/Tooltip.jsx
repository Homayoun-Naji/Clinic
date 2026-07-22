export default function Tooltip({ label, children, position = "top" }) {
  const posClasses =
    position === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs font-medium text-dark opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${posClasses}`}
      >
        {label}
      </span>
    </span>
  );
}