import { cn } from "@/lib/utils";
import { getPreset, isPreset } from "@/lib/image";

export function StudentAvatar({
  name,
  image,
  size = "md",
  className,
}: {
  name?: string;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    xs: "size-7 text-xs",
    sm: "size-9 text-sm",
    md: "size-12 text-base",
    lg: "size-20 text-2xl",
  }[size];

  const preset = getPreset(image);
  const initial = (name?.trim()[0] ?? "?").toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden flex items-center justify-center font-semibold ring-1 ring-border shrink-0",
        dims,
        className,
      )}
      style={{ background: preset?.color ?? "oklch(0.94 0 0)" }}
    >
      {preset && <span aria-hidden>{preset.emoji}</span>}
      {image && !isPreset(image) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      )}
      {!image && <span className="text-muted-foreground">{initial}</span>}
    </div>
  );
}
