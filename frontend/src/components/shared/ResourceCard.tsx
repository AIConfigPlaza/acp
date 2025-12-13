import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: "active" | "inactive" | "warning";
  metadata?: string;
  onClick?: () => void;
}

export function ResourceCard({
  title,
  description,
  icon: Icon,
  status = "active",
  metadata,
  onClick,
}: ResourceCardProps) {
  const statusColors = {
    active: "bg-emerald-500/20 text-emerald-400",
    inactive: "bg-muted text-muted-foreground",
    warning: "bg-amber-500/20 text-amber-400",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group",
        "hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-surface-2 group-hover:bg-primary/10 transition-colors shrink-0">
          <Icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">{title}</h3>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[status])}>
              {status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          {metadata && (
            <p className="text-xs text-muted-foreground/70 mt-2 font-mono">{metadata}</p>
          )}
        </div>
      </div>
    </div>
  );
}
