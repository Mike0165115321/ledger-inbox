"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "green" | "red" | "blue";
  icon?: React.ReactNode;
  gradient?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  color = "default",
  icon,
  gradient = false,
}: StatCardProps) {
  const gradientClasses = {
    default: "",
    green:
"bg-gradient-to-br from-success-emphasis-start to-success-emphasis-end text-white",
    red: "bg-gradient-to-br from-danger-emphasis-start to-danger-emphasis-end text-white",
    blue: "bg-gradient-to-br from-info-emphasis-start to-info-emphasis-end text-white",
  };

  const nonGradientClasses = {
    default: "bg-surface border-border",
    green:
      "bg-success-bg border-border",
    red: "bg-danger-bg border-border",
    blue: "bg-info-bg border-border",
  };

  const valueColors = {
    default: "text-text",
    green: gradient ? "text-white" : "text-success",
    red: gradient ? "text-white" : "text-danger",
    blue: gradient ? "text-white" : "text-info",
  };

  const trendIcon =
    trend === "up" ? (
      <TrendingUp className="w-4 h-4" />
    ) : trend === "down" ? (
      <TrendingDown className="w-4 h-4" />
    ) : null;

  const trendColor =
    trend === "up"
      ? gradient
        ? "text-white/80"
        : "text-success"
      : trend === "down"
      ? gradient
        ? "text-white/80"
        : "text-danger"
      : "";

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        gradient
          ? gradientClasses[color]
          : nonGradientClasses[color]
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className={`text-sm font-medium ${
            gradient ? "text-white/80" : "text-text-muted"
          }`}
        >
          {title}
        </p>
        {icon && (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              gradient
                ? "bg-white/20"
                : color === "green"
                ? "bg-success-bg"
                : color === "red"
                ? "bg-danger-bg"
                : color === "blue"
                ? "bg-info-bg"
                : "bg-surface-hover"
            }`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          className={`text-2xl font-bold tracking-tight ${valueColors[color]}`}
        >
          {value}
        </span>
        {trend && (
          <span className={`text-sm font-medium flex items-center gap-0.5 ${trendColor}`}>
            {trendIcon}
          </span>
        )}
      </div>
      {subtitle && (
        <p
          className={`text-xs mt-1 ${
            gradient
              ? "text-white/60"
              : "text-text-subtle"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
