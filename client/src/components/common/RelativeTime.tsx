import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface RelativeTimeProps {
  date: Date | string;
  live?: boolean;
  className?: string;
}

export function RelativeTime({ date, live, className }: RelativeTimeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [live]);

  const d = typeof date === "string" ? new Date(date) : date;
  const text = formatDistanceToNow(d, { addSuffix: true, locale: tr });

  return (
    <time dateTime={d.toISOString()} className={className} title={d.toLocaleString("tr-TR")}>
      {text}
    </time>
  );
}
