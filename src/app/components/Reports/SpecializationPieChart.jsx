"use client";

import {
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from "recharts";

const palette = [
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fb923c",
  "#60a5fa",
  "#facc15",
  "#22c55e",
];

export default function SpecializationPieChart({ data = [] }) {
  if (!data?.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
        <p className="font-medium text-white">
          No doctor specialization data available yet.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Add doctor records to view specialty distribution.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Doctors by Specialization
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Specialty distribution
          </h2>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map((entry, index) => ({
                ...entry,
                fill: palette[index % palette.length],
              }))}
              dataKey="value"
              nameKey="specialization"
              innerRadius={66}
              outerRadius={118}
              paddingAngle={4}
              stroke="transparent"
              shape={(props) => <Sector {...props} />}
            />
            <Tooltip
              formatter={(value, name, props) => [
                value,
                props?.payload?.specialization ?? name,
              ]}
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "rgba(148,163,184,0.18)",
                borderRadius: 18,
                color: "#fff",
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ color: "#cbd5e1", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
