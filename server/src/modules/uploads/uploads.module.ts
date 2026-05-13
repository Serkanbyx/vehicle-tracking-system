import { BadRequestException, Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CloudinaryProvider } from "../../config/cloudinary.js";
import { UploadsController } from "./uploads.controller.js";
import { UploadsService } from "./uploads.service.js";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Unsupported file type"), false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [CloudinaryProvider, UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
