"use client";

import { Menu } from "lucide-react";
import NavbarDropdown from "./NavbarDropdown";
import NavbarItem from "./NavbarItem";
import MobileNavbar from "./MobileMenu/MobileNavbar";
import ThemeToggle from "../theme/ThemeToggle";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  return (
    <nav className="border-b border-(--color-border) bg-(--color-surface)/95 px-6 py-3 shadow-sm backdrop-blur md:px-8 md:py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-dark lg:text-4xl">
            Homayoun Clinic
          </h1>
        </Link>
        <ul className="hidden items-center gap-4 text-light md:flex lg:gap-8">
          <NavbarItem title="Home" href="/" />
          <NavbarItem title="Reports" href="/reports" />
          <NavbarDropdown title="Doctors" entity={"doctors"} />
          <NavbarDropdown title="Patients" entity={"patients"} />
          <NavbarDropdown title="Medicines" entity={"medicines"} />
        </ul>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Menu
            className="cursor-pointer text-2xl text-light md:hidden"
            onClick={() => setIsNavbarOpen(true)}
          />
        </div>
      </div>
      <MobileNavbar
        isNavbarOpen={isNavbarOpen}
        setIsNavbarOpen={setIsNavbarOpen}
      />
    </nav>
  );
}
