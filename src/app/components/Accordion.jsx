"use client";

import { useCallback, useId, useState } from "react";

export default function Accordion({
  items = [],
  className = "",
  defaultOpenIndex = -1,
}) {
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);
  const idBase = useId();

  const toggle = useCallback((index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  }, []);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const headerId = `${idBase}-accordion-${index}-header`;
        const panelId = `${idBase}-accordion-${index}-panel`;

        return (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-[rgba(19,3,85,0.12)] bg-[var(--color-text-light)]/95 shadow-sm"
          >
            <button
              id={headerId}
              aria-controls={panelId}
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-base font-semibold text-[var(--color-primary)] transition-colors duration-200 hover:text-[var(--color-secondary)]"
            >
              <span>{item.question}</span>
              <span
                className={`text-xl transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                isOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-5 pb-5 text-sm leading-7 text-[var(--color-text-dark)]">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
