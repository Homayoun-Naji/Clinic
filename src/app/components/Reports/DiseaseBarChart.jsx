"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DiseaseBarChart({ data = [] }) {
  if (!data?.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
        <p className="font-medium text-white">
          No patient disease data available yet.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Add patient records to see trends by disease.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Patients by Disease
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Disease prevalence overview
          </h2>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 12, left: -12, bottom: 12 }}
          >
            <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
            <XAxis
              dataKey="disease"
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={75}
            />
            <YAxis
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "rgba(148,163,184,0.18)",
                borderRadius: 18,
                color: "#fff",
              }}
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
