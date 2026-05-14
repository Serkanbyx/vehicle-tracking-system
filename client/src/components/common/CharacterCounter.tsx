import { cn } from "@/lib/cn";

interface CharacterCounterProps {
  value: string;
  max: number;
  className?: string;
}

export function CharacterCounter({ value, max, className }: CharacterCounterProps) {
  const count = value.length;
  const overLimit = count > max;

  return (
    <span
      className={cn(
        "text-xs",
        overLimit ? "text-danger" : "text-gray-400",
        className,
      )}
    >
      {count}/{max}
    </span>
  );
}
