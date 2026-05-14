import { Input, Label } from "@/components/ui";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="history-from">Başlangıç</Label>
        <Input
          id="history-from"
          type="datetime-local"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="history-to">Bitiş</Label>
        <Input
          id="history-to"
          type="datetime-local"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
        />
      </div>
    </div>
  );
}
