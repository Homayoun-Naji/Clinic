export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 text-center text-[color:var(--color-text)] shadow-xl shadow-[color:var(--color-shadow)]">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-[color:var(--color-border)] border-t-[color:var(--color-secondary)]" />
      <p className="text-sm md:text-base">{message}</p>
    </div>
  );
}
