import { Readable } from "node:stream";
import { Inject, Injectable } from "@nestjs/common";
import type { UploadApiOptions, UploadApiResponse, v2 } from "cloudinary";
import { CLOUDINARY } from "../../config/cloudinary.js";

interface UploadOptions {
  folder: string;
  transformation?: Record<string, unknown>[];
}

interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class UploadsService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof v2) {}

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        folder: options.folder,
        transformation: options.transformation,
        resource_type: "image",
      };

      const stream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (err: unknown, result: UploadApiResponse | undefined) => {
          if (err || !result) {
            return reject(err ?? new Error("Upload failed"));
          }

          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      Readable.from(buffer).pipe(stream);
    });
  }

  async delete(publicId: string): Promise<void> {
    await this.cloudinary.uploader.destroy(publicId);
  }
}
