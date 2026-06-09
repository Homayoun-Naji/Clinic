import Link from "next/link";

export default function NavbarItem({ title }) {
  return (
    <>
      <li>
        <Link className="hover:underline" href="/">
          {title}
        </Link>
      </li>
    </>
  );
}
