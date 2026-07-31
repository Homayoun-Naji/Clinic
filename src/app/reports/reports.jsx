"use client";

import { useMemo, useState, useEffect } from "react";
import StatsCard from "@/app/components/Reports/StatsCard";
import DiseaseBarChart from "@/app/components/Reports/DiseaseBarChart";
import SpecializationPieChart from "@/app/components/Reports/SpecializationPieChart";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import {
  buildDashboardStats,
  buildDiseaseChartData,
  buildSpecializationChartData,
  fetchApiResource,
} from "@/app/lib/reportUtils";

const apiConfig = [
  { key: "patients", path: "/api/patients" },
  { key: "doctors", path: "/api/doctors" },
  { key: "medicines", path: "/api/medicines" },
];

export default function Reports() {
  const [apiData, setApiData] = useState({
    patients: [],
    doctors: [],
    medicines: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const responses = await Promise.all(
          apiConfig.map(async ({ key, path }) => {
            const data = await fetchApiResource(path);
            return [key, data];
          }),
        );

        if (!active) return;

        setApiData(Object.fromEntries(responses));
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load reports data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () =>
      buildDashboardStats(apiData.patients, apiData.doctors, apiData.medicines),
    [apiData],
  );

  const diseaseData = useMemo(
    () => buildDiseaseChartData(apiData.patients),
    [apiData.patients],
  );
  const specializationData = useMemo(
    () => buildSpecializationChartData(apiData.doctors),
    [apiData.doctors],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <section className="mb-8 flex flex-col gap-2">
        <span className="text-sm uppercase tracking-[0.26em] text-(--color-text-muted)">
          Dashboard
        </span>
        <h1 className="text-3xl font-semibold text-dark sm:text-4xl">
          Reports
        </h1>
        <p className="max-w-2xl text-sm text-(--color-text-muted) sm:text-base">
          A live summary of patients, doctors, medicines, and clinical
          distribution trends.
        </p>
      </section>

      {loading ? (
        <LoadingSpinner message="Loading report insights…" />
      ) : error ? (
        <div className="rounded-3xl border border-(--color-error)/30 bg-(--color-error)/10 p-8 text-center text-light shadow-xl">
          <p className="text-lg font-semibold">
            Unable to load the report data.
          </p>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            {error}
          </p>
        </div>
      ) : (
        <section className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              statKey="totalPatients"
              value={stats.totalPatients}
              description="Current patient records in the system."
            />
            <StatsCard
              statKey="totalDoctors"
              value={stats.totalDoctors}
              description="Doctors registered across all clinics."
            />
            <StatsCard
              statKey="totalMedicines"
              value={stats.totalMedicines}
              description="Medicines stored in inventory."
            />
            <StatsCard
              statKey="totalDiseases"
              value={stats.totalDiseases}
              description="Unique diseases tracked in patient records."
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <DiseaseBarChart data={diseaseData} />
            <SpecializationPieChart data={specializationData} />
          </div>
        </section>
      )}
    </main>
  );
}
