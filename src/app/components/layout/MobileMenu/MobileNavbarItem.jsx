import { ChevronDown, ChevronRight } from "lucide-react";
import SubmenuItem from "../SubmenuItem";

export default function MobileNavbarItem({ title, isAccordionOpen, onClick }) {
  return (
    <li className="px-4 py-6">
      <div className="flex justify-between items-center" onClick={onClick}>
        <p className="text-xl font-bold">{title}</p>
        {isAccordionOpen ? (
          <ChevronDown className="text-xl" />
        ) : (
          <ChevronRight className="text-xl" />
        )}
      </div>
      <div
        className={`flex-col ms-4 text-lg py-2 gap-1 ${
          isAccordionOpen ? "flex" : "hidden"
        }`}
      >
        <SubmenuItem title="Add" />
        <SubmenuItem title="Update" />
        <SubmenuItem title="Delete" />
        <SubmenuItem title="Show" />
      </div>
    </li>
  );
}
