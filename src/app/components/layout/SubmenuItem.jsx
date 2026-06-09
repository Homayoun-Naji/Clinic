import Link from "next/link";

export default function SubmenuItem({ title, route }) {
  return (
    <Link
      className="transition hover:scale-110"
      href={`${route}`}
    >
      {title}
    </Link>
  );
}
