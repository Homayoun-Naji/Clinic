import Link from "next/link";

export default function NavbarItem({ title, href }) {
  return (
    <li>
      <Link
        className="rounded-full px-3 py-2 text-lg font-medium transition-colors hover:bg-(--color-surface-muted) hover:text-dark"
        href={href}
      >
        {title}
      </Link>
    </li>
  );
}
