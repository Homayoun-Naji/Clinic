"use client";

import { useState, useEffect, useMemo } from "react";
import ShowCard from "@/app/components/ShowCard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import axios from "axios";

const doctorsTitle = [
  "First Name",
  "Last Name",
  "Specialization",
  "Phone",
  "Email",
];

const doctorsKeys = [
  "first_name",
  "last_name",
  "specialization",
  "phone",
  "email",
];

function doctorsDataGenerator(data) {
  return data.map((doctor) =>
    doctorsKeys.map((key, index) => ({
      title: doctorsTitle[index],
      value: doctor[key],
    })),
  );
}

export default function DoctorsShow() {
  const [doctorsData, setDoctorsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get("http://localhost:3000/api/doctors");
        setDoctorsData(res.data);
      } catch (err) {
        console.error(err);
        setDoctorsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const generatedDoctorsData = useMemo(
    () => doctorsDataGenerator(doctorsData),
    [doctorsData],
  );

  // Pagination calculations
  const totalPages = Math.ceil(generatedDoctorsData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = generatedDoctorsData.slice(startIndex, endIndex);

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
      <div className="p-8 mt-12">
        <LoadingSpinner message="Loading doctors..." />
      </div>
    );
  }

  return (
    <div className="p-8 mt-12">
      <div className="grid grid-cols-4 gap-8 mb-8">
        {currentData.map((doctor, index) => {
          return <ShowCard key={index} data={doctor} />;
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageClick(index + 1)}
                className={`px-3 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
