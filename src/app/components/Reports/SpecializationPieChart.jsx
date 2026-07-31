"use client";

import {
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from "recharts";
import useMediaQuery from "@/app/lib/useMediaQuery";

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
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!data?.length) {
    return (
      <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-light shadow-xl shadow-(color:--color-shadow)">
        <p className="font-medium text-dark">
          No doctor specialization data available yet.
        </p>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          Add doctor records to view specialty distribution.
        </p>
      </div>
    );
  }

  // On mobile, shift the legend below the chart and shrink the pie so they
  // no longer overlap; the desktop layout stays vertical-right aligned.
  const innerRadius = isMobile ? 50 : 66;
  const outerRadius = isMobile ? 94 : 118;

  return (
    <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-xl shadow-(color:--color-shadow)">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-(--color-text-muted)">
            Doctors by Specialization
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-dark">
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
              innerRadius={innerRadius}
              outerRadius={outerRadius}
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
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                borderRadius: 18,
                color: "var(--color-text)",
              }}
            />
            <Legend
              layout={isMobile ? "horizontal" : "vertical"}
              verticalAlign={isMobile ? "bottom" : "middle"}
              align={isMobile ? "center" : "right"}
              wrapperStyle={{
                color: "var(--color-text-muted)",
                fontSize: isMobile ? 12 : 13,
                paddingTop: isMobile ? 16 : 0,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
