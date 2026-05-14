import { cn } from "@/lib/cn";

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

interface SpinnerProps {
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
}

export function Spinner({ size = "md", label = "Yükleniyor", className }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "animate-spin rounded-full border-brand-600 border-t-transparent",
          SIZES[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
