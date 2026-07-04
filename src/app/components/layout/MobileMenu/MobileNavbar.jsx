import { X } from "lucide-react";
import MobileNavbarItem from "./MobileNavbarItem";
import { useState } from "react";

export default function MobileNavbar({ isNavbarOpen, setIsNavbarOpen }) {
  const [isAccordionOpen, setAccordionOpen] = useState(null);

  return (
    <div
      className={`fixed right-0 top-0 h-full w-full border-l border-(--color-border) bg-(--color-surface) p-6 transition-all duration-500 md:hidden ${
        isNavbarOpen ? "visible translate-y-0" : "invisible -translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark">
          Homayoun Clinic
        </h2>
        <X
          className="cursor-pointer text-3xl text-light"
          onClick={() => setIsNavbarOpen(false)}
        />
      </div>
      <ul className="p-12">
        <MobileNavbarItem
          title="Doctors"
          isAccordionOpen={isAccordionOpen === "doctors"}
          onClick={() => {
            setAccordionOpen((prev) => (prev === "doctors" ? null : "doctors"));
          }}
        />
        <MobileNavbarItem
          title="Patients"
          isAccordionOpen={isAccordionOpen === "patients"}
          onClick={() => {
            setAccordionOpen((prev) =>
              prev === "patients" ? null : "patients",
            );
          }}
        />
        <MobileNavbarItem
          title="Medicines"
          isAccordionOpen={isAccordionOpen === "medicines"}
          onClick={() => {
            setAccordionOpen((prev) =>
              prev === "medicines" ? null : "medicines",
            );
          }}
        />
      </ul>
    </div>
  );
}
