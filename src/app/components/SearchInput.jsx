"use client";

import { Search, X } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder }) {
  const hasValue = value.length > 0;

  const handleClear = () => {
    onChange({ target: { value: "" } });
  };

  return (
    <div className="relative mb-8 w-full max-w-md mx-auto">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search size={18} className="text-(--color-text-muted)" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-(--color-input-border) bg-(--color-input-bg) py-2 pl-10 pr-10 text-light outline-none transition focus:border-secondary"
      />
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-(--color-text-muted) hover:text-light"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
