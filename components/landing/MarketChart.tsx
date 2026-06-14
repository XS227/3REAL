"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUsdPrice, type ChartPoint } from "@/lib/landing/market";

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#d4d4d8",
  fontSize: 12,
};

const axisStyle = { fontSize: 11, fill: "#52525b" };

function shortDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MarketChart({
  data,
  name = "TON/USD",
  color = "#f59e0b",
  tiny = false,
}: {
  data: ChartPoint[];
  name?: string;
  color?: string;
  /** Use DEX-style subscript formatting for sub-cent prices (e.g. REAL) */
  tiny?: boolean;
}) {
  const gradientId = useId();
  const points = data.map((p) => ({ ...p, label: shortDate(p.date) }));

  const formatValue = (v: number) =>
    tiny ? formatUsdPrice(v) : `$${v.toFixed(v >= 1 ? 2 : 4)}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="label"
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: "#27272a" }}
          minTickGap={32}
        />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          tickFormatter={(v: number) => formatValue(v)}
          width={tiny ? 76 : 62}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [formatValue(Number(value)), name]}
          labelStyle={{ color: "#a1a1aa" }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={1200}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
