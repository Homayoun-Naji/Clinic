"use client";

import { useState } from "react";

export default function Accordion({ items, className = "" }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {items.map(({ question, answer }, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={question}
            className="overflow-hidden px-5 py-4 rounded-2xl border border-[rgba(19,3,85,0.12)] bg-[#e8eaf6] shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between pb-2 text-start text-base font-semibold text-primary transition-colors duration-200 hover:text-secondary"
            >
              <span>{question}</span>
              <span
                className={`text-xl transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>

            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                isOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="pe-12 text-sm leading-5 text-dark">
                {answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
