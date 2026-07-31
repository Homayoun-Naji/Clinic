"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-16 text-light">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border border-(--color-border) bg-(--color-surface) p-10 text-center shadow-xl shadow-(color:--color-shadow)">
        <AlertTriangle
          className="h-14 w-14 text-secondary"
          aria-hidden="true"
        />
        <h1 className="text-4xl font-bold text-dark md:text-5xl">
          Something Went Wrong
        </h1>
        <p className="max-w-md text-sm leading-7 text-(--color-text-muted) md:text-base">
          An unexpected error occurred. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-md bg-secondary px-5 py-2 font-medium text-white transition-transform hover:scale-[1.01]"
        >
          Try Again
        </button>
      </div>
    </section>
  );
}
