"use client";

import type React from "react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const MONTH_LABEL: Record<number, string> = {
  1: "Ianuarie",
  2: "Februarie",
  3: "Martie",
  4: "Aprilie",
  5: "Mai",
  6: "Iunie",
  7: "Iulie",
  8: "August",
  9: "Septembrie",
  10: "Octombrie",
  11: "Noiembrie",
  12: "Decembrie",
};

type Props = {
  totalClients: number;
  clientsWithUploadsThisMonth: number;
  clientsWithoutUploadsThisMonth: number;
  uploadsByDocType: { name: string; count: number }[];
  currentMonth: number;
  currentYear: number;
};

const SAGE = "#4b7a6e";
const INK = "#1a1a2e";
const INK_MUTED = "#8888aa";
const PIE_COLORS = [
  "#4b7a6e",
  "#3a6358",
  "#6b9a8e",
  "#8bb5a8",
  "#2d4a42",
  "#7aa89a",
  "#5a8a7e",
  "#9bc4b8",
];

export function StatisticiCharts({
  totalClients,
  clientsWithUploadsThisMonth,
  clientsWithoutUploadsThisMonth,
  uploadsByDocType,
  currentMonth,
  currentYear,
}: Props) {
  const sentPieData = [
    {
      name: "Au trimis documente",
      value: clientsWithUploadsThisMonth,
      color: SAGE,
    },
    {
      name: "Nu au trimis",
      value: clientsWithoutUploadsThisMonth,
      color: INK_MUTED,
    },
  ].filter((d) => d.value > 0);

  const docTypePieData = uploadsByDocType.map((d, i) => ({
    name: d.name,
    value: d.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* KPI — 2×2, compact, fără iconițe */}
      <div className="grid grid-cols-2 gap-2">
        <div className="dash-card !p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-0.5">Total</p>
          <p className="text-lg font-semibold text-[var(--ink)]">{totalClients}</p>
        </div>
        <div className="dash-card !p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-0.5">Au trimis</p>
          <p className="text-lg font-semibold text-[var(--sage)]">{clientsWithUploadsThisMonth}</p>
        </div>
        <div className="dash-card !p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-0.5">Fără</p>
          <p className="text-lg font-semibold text-[var(--ink)]">{clientsWithoutUploadsThisMonth}</p>
        </div>
        <div className="dash-card !p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-0.5">Rata %</p>
          <p className="text-lg font-semibold text-[var(--ink)]">
            {totalClients === 0 ? "—" : `${Math.round((clientsWithUploadsThisMonth / totalClients) * 100)}%`}
          </p>
        </div>
      </div>

      {/* Clienți luna curentă (stânga) + Tipuri de acte (dreapta) – același tip de grafic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="dash-card min-w-0 overflow-hidden">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
            Clienți – luna curentă
          </h2>
          {sentPieData.length === 0 ? (
            <p className="text-[var(--ink-muted)] py-8 text-center">
              Nu există date pentru luna curentă. Adaugă clienți și documente.
            </p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
                  <Pie
                    data={sentPieData}
                    cx="45%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {sentPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown): [React.ReactNode, string] => [typeof value === "number" ? value : 0, ""]} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ paddingLeft: 16 }}
                    formatter={(value, entry: { payload?: { value?: number } }) => (
                      <span style={{ fontSize: 13 }}>{value} ({entry?.payload?.value ?? 0})</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="dash-card min-w-0 overflow-hidden">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
            Tipuri de acte (cele mai trimise)
          </h2>
          {docTypePieData.length === 0 ? (
            <p className="text-[var(--ink-muted)] py-8 text-center">
              Nu există încă documente încărcate.
            </p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
                  <Pie
                    data={docTypePieData}
                    cx="45%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {docTypePieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown): [React.ReactNode, string] => [typeof value === "number" ? value : 0, "Număr"]} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ paddingLeft: 16 }}
                    formatter={(value, entry: { payload?: { value?: number } }) => (
                      <span style={{ fontSize: 13 }}>{value} ({entry?.payload?.value ?? 0})</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
