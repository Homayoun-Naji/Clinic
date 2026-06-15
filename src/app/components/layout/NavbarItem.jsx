import Link from "next/link";

export default function NavbarItem({ title, href }) {
  return (
    <>
      <li>
        <Link className="hover:underline" href={href}>
          {title}
        </Link>
      </li>
    </>
  );
}
