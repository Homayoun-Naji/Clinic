import Link from "next/link";

export default function SubmenuItem({ title, route }) {
  return (
    <Link
      className="rounded-lg px-2 py-1 text-sm transition-colors hover:bg-(--color-surface-muted) hover:text-dark"
      href={`${route}`}
    >
      {title}
    </Link>
  );
}
