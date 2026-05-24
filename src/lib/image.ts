export async function fileToResizedDataURL(
  file: File,
  maxSize = 512,
  mimeType: "image/jpeg" | "image/webp" = "image/jpeg",
  quality = 0.82,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context not available");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL(mimeType, quality);
}

export function isPreset(value?: string | null): boolean {
  return typeof value === "string" && value.startsWith("preset:");
}

export const PRESET_AVATARS = [
  { id: "owl", emoji: "🦉", color: "oklch(0.85 0.13 75)" },
  { id: "fox", emoji: "🦊", color: "oklch(0.78 0.18 50)" },
  { id: "panda", emoji: "🐼", color: "oklch(0.92 0.02 0)" },
  { id: "cat", emoji: "🐱", color: "oklch(0.88 0.1 75)" },
  { id: "dog", emoji: "🐶", color: "oklch(0.82 0.1 60)" },
  { id: "rabbit", emoji: "🐰", color: "oklch(0.92 0.06 0)" },
  { id: "bear", emoji: "🐻", color: "oklch(0.78 0.08 50)" },
  { id: "lion", emoji: "🦁", color: "oklch(0.85 0.13 90)" },
  { id: "tiger", emoji: "🐯", color: "oklch(0.85 0.13 50)" },
  { id: "monkey", emoji: "🐵", color: "oklch(0.78 0.1 60)" },
  { id: "frog", emoji: "🐸", color: "oklch(0.85 0.13 145)" },
  { id: "unicorn", emoji: "🦄", color: "oklch(0.88 0.1 320)" },
] as const;

export type PresetAvatarId = (typeof PRESET_AVATARS)[number]["id"];

export function getPreset(value?: string | null) {
  if (!isPreset(value)) return null;
  const id = value!.slice("preset:".length);
  return PRESET_AVATARS.find((p) => p.id === id) ?? null;
}
