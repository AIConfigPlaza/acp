import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-xs mt-2 font-medium",
                trend.positive ? "text-emerald-400" : "text-destructive"
              )}
            >
              {trend.positive ? "+" : "-"}{Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-surface-2 group-hover:bg-primary/10 transition-colors">
          <Icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}
