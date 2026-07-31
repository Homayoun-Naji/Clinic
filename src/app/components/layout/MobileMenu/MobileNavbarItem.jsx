import { ChevronDown, ChevronRight } from "lucide-react";
import SubmenuItem from "../SubmenuItem";
import Link from "next/link";

export default function MobileNavbarItem({
  title,
  route,
  isAccordionOpen,
  onClick,
  onNavClick,
}) {
  const isAccordion = typeof onClick === "function";

  return (
    <li className="border-b border-(--color-border)">
      <div
        className={`flex items-center justify-between py-4 text-xl font-bold text-dark ${
          isAccordion ? "cursor-pointer" : ""
        }`}
        onClick={onClick}
      >
        {isAccordion ? (
          title
        ) : (
          <Link href={`/${route}`} onClick={onNavClick} className="block w-full">
            {title}
          </Link>
        )}
        {isAccordion &&
          (isAccordionOpen ? (
            <ChevronDown className="text-xl text-light" />
          ) : (
            <ChevronRight className="text-xl text-light" />
          ))}
      </div>
      {isAccordion && (
        <div
          className={`flex-col gap-1 ps-4 text-lg ${
            isAccordionOpen ? "flex" : "hidden"
          }`}
        >
          <SubmenuItem title="Add" route={route} onClick={onNavClick} />
          <SubmenuItem
            title="Show"
            route={`${route}/show`}
            onClick={onNavClick}
          />
        </div>
      )}
    </li>
  );
}
