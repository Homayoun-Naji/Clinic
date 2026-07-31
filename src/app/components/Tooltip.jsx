export default function Tooltip({ label, children }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-nowrap rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs font-medium text-dark opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
