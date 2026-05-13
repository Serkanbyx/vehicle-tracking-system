import { fetcher } from "./client";

interface UploadResponse {
  url: string;
  publicId: string;
}

function uploadFile(endpoint: string, file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return fetcher<UploadResponse>(endpoint, {
    method: "POST",
    body: formData,
  });
}

export function uploadDriver(file: File): Promise<UploadResponse> {
  return uploadFile("/uploads/driver", file);
}

export function uploadVehicle(file: File): Promise<UploadResponse> {
  return uploadFile("/uploads/vehicle", file);
}

export function uploadAvatar(file: File): Promise<UploadResponse> {
  return uploadFile("/uploads/avatar", file);
}

export function deleteAsset(publicId: string): Promise<void> {
  return fetcher(`/uploads/${encodeURIComponent(publicId)}`, { method: "DELETE" });
}
