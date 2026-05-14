import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_SIZE_MB = 5;

interface PhotoUploadProps {
  value: string | null;
  onUpload: (file: File) => Promise<string>;
  onClear: () => void;
  label?: string;
  className?: string;
}

export function PhotoUpload({
  value,
  onUpload,
  onClear,
  label = "Fotoğraf",
  className,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Sadece JPEG, PNG veya WebP formatları desteklenir");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Dosya boyutu ${MAX_SIZE_MB}MB'ı aşamaz`);
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      setError("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {value ? (
        <div className="relative h-24 w-24 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-4 w-4" />
          )}
          {uploading ? "Yükleniyor…" : "Yükle"}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => void handleChange(e)}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
