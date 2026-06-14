"use client";

import { CiMenuFries } from "react-icons/ci";
import NavbarDropdown from "./NavbarDropdown";
import NavbarItem from "./NavbarItem";
import MobileNavbar from "./MobileMenu/MobileNavbar";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  return (
    <nav className="flex justify-between items-center px-8 py-3 md:py-6 bg-secondary">
      <Link href="/">
        <h1 className="text-2xl lg:text-4xl font-bold select-none">
          Homayoun Clinic
        </h1>
      </Link>
      <ul className="hidden md:flex md:gap-4 lg:gap-8">
        <NavbarItem title="Home" />
        <NavbarItem title="About Us" />
        <NavbarDropdown title="Doctors" entity={"doctors"} />
        <NavbarDropdown title="Patients" entity={"patients"} />
        <NavbarDropdown title="Medicines" entity={"medicines"} />
      </ul>
      <CiMenuFries
        className="text-2xl cursor-pointer md:hidden"
        onClick={() => setIsNavbarOpen(true)}
      />
      <MobileNavbar
        isNavbarOpen={isNavbarOpen}
        setIsNavbarOpen={setIsNavbarOpen}
      />
    </nav>
  );
}
