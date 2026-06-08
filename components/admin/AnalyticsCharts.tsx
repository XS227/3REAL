"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DayPoint } from "@/lib/admin/analytics";

type Props = {
  userGrowth: DayPoint[];
  kycApprovals: DayPoint[];
  depositVolume: DayPoint[];
  withdrawalVolume: DayPoint[];
  referralActivity: DayPoint[];
};

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#d4d4d8",
  fontSize: 12,
};

const axisStyle = { fontSize: 11, fill: "#52525b" };

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <div className="h-44">{children}</div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function AnalyticsCharts({
  userGrowth,
  kycApprovals,
  depositVolume,
  withdrawalVolume,
  referralActivity,
}: Props) {
  const mapData = (points: DayPoint[]) =>
    points.map((p) => ({ ...p, label: shortDate(p.date) }));

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {/* User growth */}
      <ChartCard title="User Registrations">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mapData(userGrowth)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-users" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={fmt} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "New users"]} labelStyle={{ color: "#a1a1aa" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#grad-users)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* KYC approvals */}
      <ChartCard title="KYC Approvals">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mapData(kycApprovals)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Approved"]} labelStyle={{ color: "#a1a1aa" }} />
            <Bar dataKey="value" fill="#34d399" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Deposit volume */}
      <ChartCard title="Deposit Volume">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mapData(depositVolume)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={fmt} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v)), "Volume"]} labelStyle={{ color: "#a1a1aa" }} />
            <Bar dataKey="value" fill="#60a5fa" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Withdrawal volume */}
      <ChartCard title="Withdrawal Volume">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mapData(withdrawalVolume)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={fmt} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v)), "Volume"]} labelStyle={{ color: "#a1a1aa" }} />
            <Bar dataKey="value" fill="#c084fc" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Referral activity */}
      <ChartCard title="Referral Rewards Issued">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mapData(referralActivity)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-ref" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Rewards"]} labelStyle={{ color: "#a1a1aa" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#grad-ref)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
