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
      <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-light shadow-xl shadow-(color:--color-shadow)">
        <p className="font-medium text-dark">
          No patient disease data available yet.
        </p>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          Add patient records to see trends by disease.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-xl shadow-(color:--color-shadow)">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-(--color-text-muted)">
            Patients by Disease
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-dark">
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
            <CartesianGrid
              stroke="color-mix(in srgb, var(--color-text-muted) 18%, transparent)"
              vertical={false}
            />
            <XAxis
              dataKey="disease"
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={75}
            />
            <YAxis
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                borderRadius: 18,
                color: "var(--color-text)",
              }}
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
