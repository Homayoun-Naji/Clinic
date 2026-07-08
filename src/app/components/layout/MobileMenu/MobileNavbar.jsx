import { X } from "lucide-react";
import MobileNavbarItem from "./MobileNavbarItem";
import { useState, useEffect } from "react";

export default function MobileNavbar({ isNavbarOpen, setIsNavbarOpen }) {
  const [isAccordionOpen, setAccordionOpen] = useState(null);

  useEffect(() => {
    if (isNavbarOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Apply scroll lock: prevent body scrolling
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      
      // Store scroll position for restoration
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      // Restore scroll position
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      
      // Remove scroll lock styles
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
      
      // Clean up data attribute
      delete document.body.dataset.scrollY;
    }

    // Cleanup on unmount
    return () => {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
      delete document.body.dataset.scrollY;
    };
  }, [isNavbarOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 h-screen w-screen overflow-y-auto border-l border-(--color-border) bg-(--color-surface) p-6 transition-all duration-500 md:hidden ${
        isNavbarOpen
          ? "visible translate-y-0 opacity-100"
          : "invisible -translate-y-full opacity-0"
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
          onNavClick={() => setIsNavbarOpen(false)}
        />
        <MobileNavbarItem
          title="Patients"
          isAccordionOpen={isAccordionOpen === "patients"}
          onClick={() => {
            setAccordionOpen((prev) =>
              prev === "patients" ? null : "patients",
            );
          }}
          onNavClick={() => setIsNavbarOpen(false)}
        />
        <MobileNavbarItem
          title="Medicines"
          isAccordionOpen={isAccordionOpen === "medicines"}
          onClick={() => {
            setAccordionOpen((prev) =>
              prev === "medicines" ? null : "medicines",
            );
          }}
          onNavClick={() => setIsNavbarOpen(false)}
        />
      </ul>
    </div>
  );
}