import { useEffect, useState } from "react";

/**
 * Tracks whether a CSS media query matches, with SSR safety.
 * Returns false during initial SSR render so the first client paint
 * matches the server markup (avoids hydration mismatch).
 *
 * @param {string} query - A CSS media query string, e.g. "(max-width: 767px)".
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    const update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    update();

    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
