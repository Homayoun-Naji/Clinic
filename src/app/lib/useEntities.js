import { useCallback, useEffect, useState } from "react";
import { fetchEntities } from "./api";

/**
 * Reusable data-fetching hook for entity GET operations.
 * Encapsulates loading state, error handling, and refetch logic.
 *
 * @param {string} apiPath - The entity API endpoint.
 * @returns {{ data, isLoading, error, refetch }}
 */
export function useEntities(apiPath) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await fetchEntities(apiPath);
      setData(responseData);
    } catch (err) {
      console.error(err);
      setError(err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}