"use client";

import CountUp from "react-countup";
import {
  ArrowUpRight,
  BriefcaseMedical,
  Users,
  Stethoscope,
  Pill,
} from "lucide-react";

const cardIconMap = {
  totalPatients: Users,
  totalDoctors: Stethoscope,
  totalMedicines: Pill,
  totalDiseases: BriefcaseMedical,
};

const cardLabelMap = {
  totalPatients: "Total Patients",
  totalDoctors: "Total Doctors",
  totalMedicines: "Total Medicines",
  totalDiseases: "Total Diseases",
};

const cardAccentMap = {
  totalPatients: "from-sky-500 via-indigo-500 to-violet-500",
  totalDoctors: "from-emerald-500 via-teal-500 to-cyan-500",
  totalMedicines: "from-amber-500 via-orange-500 to-rose-500",
  totalDiseases: "from-fuchsia-500 via-purple-500 to-indigo-500",
};

export default function StatsCard({ statKey, value, description }) {
  const Icon = cardIconMap[statKey] || ArrowUpRight;
  const label = cardLabelMap[statKey] || "Statistic";
  const accent =
    cardAccentMap[statKey] || "from-slate-500 via-slate-600 to-slate-700";

  return (
    <div className="group overflow-hidden rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-xl shadow-(color:--color-shadow) transition duration-300 hover:-translate-y-1 hover:border-secondary/40">
      <div
        className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-linear-to-br ${accent} text-white shadow-lg shadow-black/20`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-(--color-text-muted)">
          {label}
        </p>
        <p className="text-3xl font-semibold text-dark">
          <CountUp end={value} duration={3} separator="," />
        </p>
        {description ? (
          <p className="text-sm leading-6 text-(--color-text-muted)">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
