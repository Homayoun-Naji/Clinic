import Link from "next/link";

export default function SubmenuItem({ title, route, onClick }) {
  return (
    <Link
      className="px-2 py-1 text-sm"
      href={`/${route}`}
      onClick={onClick}
    >
      {title}
    </Link>
  );
}
