import { useMemo } from "react";

/**
 * Memoized client-side search over already-loaded data.
 *
 * - Case-insensitive (toLowerCase).
 * - Trims leading/trailing whitespace.
 * - Uses startsWith (not includes) so "ali" matches "Ali" / "Alireza"
 *   but not "Mohammad Ali".
 * - For multi-field entities (doctors/patients) the search term is also
 *   compared against the normalized full name (first + " " + last), so
 *   "ali mo" matches "Ali Mohammadi".
 *
 * @param {Array<Object>} data - The source data to filter.
 * @param {string} searchTerm - Current search input value.
 * @param {Array<string>} searchKeys - Field keys to search (e.g. ["first_name", "last_name"]).
 * @returns {Array<Object>} Filtered list, recomputed only when data/searchTerm/searchKeys change.
 */
export function useSearch(data, searchTerm, searchKeys) {
  return useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    if (!term) return data;
    if (!searchKeys || searchKeys.length === 0) return data;

    const fullKey = searchKeys.length > 1 ? searchKeys.join(" ") : null;

    return data.filter((item) => {
      // Check each individual field with startsWith.
      for (const key of searchKeys) {
        const value = item[key];
        if (value == null) continue;
        if (String(value).toLowerCase().startsWith(term)) return true;
      }

      // For multi-field entities, also match against the normalized full name
      // so "ali mo" matches "Ali Mohammadi".
      if (fullKey) {
        const fullName = searchKeys
          .map((key) => item[key])
          .filter((v) => v != null)
          .join(" ")
          .toLowerCase();
        if (fullName.startsWith(term)) return true;
      }

      return false;
    });
  }, [data, searchTerm, searchKeys]);
}
