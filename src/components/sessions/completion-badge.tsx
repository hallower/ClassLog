import { cn, completionBucket } from "@/lib/utils";

export function CompletionBadge({
  rate,
  className,
  size = "md",
}: {
  rate?: number | null;
  className?: string;
  size?: "sm" | "md";
}) {
  const bucket = completionBucket(rate);
  if (bucket === "none") {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }
  const styles = {
    low: "bg-completion-low text-completion-low-foreground font-bold",
    mid: "bg-completion-mid text-completion-mid-foreground font-semibold",
    high: "bg-completion-high text-completion-high-foreground font-semibold",
  }[bucket];
  const sizeCls = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm";
  return (
    <span
      className={cn("inline-flex items-center rounded-md", styles, sizeCls, className)}
      aria-label={`이행률 ${rate}%`}
    >
      {rate}%
    </span>
  );
}

export function completionRowClass(rate?: number | null): string {
  const bucket = completionBucket(rate);
  if (bucket === "low") return "bg-completion-low/50 [&_td]:font-bold";
  if (bucket === "mid") return "bg-completion-mid/30";
  if (bucket === "high") return "bg-completion-high/40";
  return "";
}
