"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ShowCard from "@/app/components/ShowCard";

export default function EntityShow({
  apiPath,
  dataTitles,
  dataKeys,
  loadingMessage = "Loading...",
  itemsPerPage = 8,
}) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(apiPath);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiPath]);

  const generatedData = useMemo(
    () =>
      data.map((item) =>
        dataKeys.map((key, index) => ({
          title: dataTitles[index],
          value: item[key],
        })),
      ),
    [data, dataKeys, dataTitles],
  );

  const totalPages = Math.ceil(generatedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = generatedData.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 mt-12">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  return (
    <div className="p-8 mt-12 flex-1">
      {generatedData.length === 0 ? (
        <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-10 text-center text-light shadow-xl shadow-(color:--color-shadow)">
          <p>No data available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-8 mb-8">
            {currentData.map((item, index) => (
              <ShowCard key={index} data={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="rounded-lg bg-secondary px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageClick(index + 1)}
                    className={`rounded-lg px-3 py-2 ${
                      currentPage === index + 1
                        ? "bg-secondary text-white"
                        : "bg-(--color-surface-muted) text-light hover:bg-(--color-border)"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="rounded-lg bg-secondary px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
