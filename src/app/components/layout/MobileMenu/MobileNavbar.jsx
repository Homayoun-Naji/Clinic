import { X } from "lucide-react";
import MobileNavbarItem from "./MobileNavbarItem";
import { useState } from "react";

export default function MobileNavbar({ isNavbarOpen, setIsNavbarOpen }) {
  const [isAccordionOpen, setAccordionOpen] = useState(null);

  return (
    <div
      className={`w-full h-full fixed top-0 right-0 bg-secondary md:hidden p-6 transition-all duration-500 ${
        isNavbarOpen ? "visible translate-y-0" : "invisible -translate-y-full"
      }`}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Homayoun Clinic</h2>
        <X
          className="text-3xl cursor-pointer"
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
