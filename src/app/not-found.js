import Link from "next/link";
import { FileQuestion } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found",
};

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-16 text-light">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border border-(--color-border) bg-(--color-surface) p-10 text-center shadow-xl shadow-(color:--color-shadow)">
        <FileQuestion
          className="h-14 w-14 text-secondary"
          aria-hidden="true"
        />
        <h1 className="text-4xl font-bold text-dark md:text-5xl">
          404 - Page Not Found
        </h1>
        <p className="max-w-md text-sm leading-7 text-(--color-text-muted) md:text-base">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-md bg-secondary px-5 py-2 font-medium text-white transition-transform hover:scale-[1.01]"
        >
          Return Home
        </Link>
      </div>
    </section>
  );
}
