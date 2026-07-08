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

  const getVisiblePages = (pageCount, activePage, maxVisiblePages) => {
    if (pageCount <= maxVisiblePages) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const pages = [1];
    const middlePagesCount = Math.max(maxVisiblePages - 2, 1);
    const halfMiddleWindow = Math.floor(middlePagesCount / 2);

    let startPage = activePage - halfMiddleWindow;
    let endPage = startPage + middlePagesCount - 1;

    if (startPage < 2) {
      startPage = 2;
      endPage = startPage + middlePagesCount - 1;
    }

    if (endPage > pageCount - 1) {
      endPage = pageCount - 1;
      startPage = endPage - middlePagesCount + 1;
    }

    if (startPage > 2) {
      pages.push("ellipsis-left");
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    if (endPage < pageCount - 1) {
      pages.push("ellipsis-right");
    }

    pages.push(pageCount);

    return pages;
  };

  const desktopPageItems = getVisiblePages(totalPages, currentPage, 9);
  const mobilePageItems = getVisiblePages(totalPages, currentPage, 6);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 mt-12">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  return (
    <div className="px-8 md:p-8 mt-12 flex-1">
      {generatedData.length === 0 ? (
        <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-10 text-center text-light shadow-xl shadow-(color:--color-shadow)">
          <p>No data available.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-6 md:gap-8 mb-8">
            {currentData.map((item, index) => (
              <ShowCard key={index} data={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mt-8 md:mt-12">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="hidden md:block rounded-lg bg-secondary px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
              >
                Previous
              </button>

              <div className="hidden md:flex gap-2 order-first md:order-0">
                {desktopPageItems.map((pageItem, index) =>
                  pageItem === "ellipsis-left" || pageItem === "ellipsis-right" ? (
                    <span
                      key={`${pageItem}-${index}`}
                      className="rounded-lg px-3 py-2 text-light"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageItem}
                      onClick={() => handlePageClick(pageItem)}
                      className={`rounded-lg px-3 py-2 ${
                        currentPage === pageItem
                          ? "bg-secondary text-white"
                          : "bg-(--color-surface-muted) text-light hover:bg-(--color-border)"
                      }`}
                    >
                      {pageItem}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="hidden md:block rounded-lg bg-secondary px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
              >
                Next
              </button>

              <div className="md:hidden w-full flex flex-col gap-2">
                <div className="flex gap-1.5 justify-center">
                  {mobilePageItems.map((pageItem, index) =>
                    pageItem === "ellipsis-left" || pageItem === "ellipsis-right" ? (
                      <span
                        key={`${pageItem}-${index}`}
                        className="rounded-lg px-3 py-2 text-light"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageItem}
                        onClick={() => handlePageClick(pageItem)}
                        className={`rounded-lg px-3 py-2 ${
                          currentPage === pageItem
                            ? "bg-secondary text-white"
                            : "bg-(--color-surface-muted) text-light hover:bg-(--color-border)"
                        }`}
                      >
                        {pageItem}
                      </button>
                    ),
                  )}
                </div>
                <div className="w-full flex justify-between gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="rounded-lg bg-secondary w-1/2 px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="rounded-lg bg-secondary w-1/2 px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--color-border)"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
