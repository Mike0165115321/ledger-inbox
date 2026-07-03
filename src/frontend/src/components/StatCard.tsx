interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "green" | "red" | "blue";
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  color = "default",
}: StatCardProps) {
  const colorClasses = {
    default: "bg-white border-zinc-200",
    green: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    blue: "bg-blue-50 border-blue-200",
  };

  const valueColors = {
    default: "text-zinc-900",
    green: "text-emerald-700",
    red: "text-red-700",
    blue: "text-blue-700",
  };

  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "";
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "";

  return (
    <div
      className={`rounded-xl border p-5 ${colorClasses[color]} transition-shadow hover:shadow-sm`}
    >
      <p className="text-sm text-zinc-500 font-medium">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-2xl font-bold tracking-tight ${valueColors[color]}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-sm font-medium ${trendColor}`}>{trendIcon}</span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
