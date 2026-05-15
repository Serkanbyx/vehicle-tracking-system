import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import type { UploadsService } from "./uploads.service.js";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Throttle({ upload: { ttl: 3_600_000, limit: 30 } })
  @UseInterceptors(FileInterceptor("image"))
  @Post("driver")
  async uploadDriver(@UploadedFile() file: Express.Multer.File) {
    this.assertFile(file);

    const result = await this.uploadsService.upload(file.buffer, {
      folder: "vtracker/drivers",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    return { success: true, data: result };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Throttle({ upload: { ttl: 3_600_000, limit: 30 } })
  @UseInterceptors(FileInterceptor("image"))
  @Post("vehicle")
  async uploadVehicle(@UploadedFile() file: Express.Multer.File) {
    this.assertFile(file);

    const result = await this.uploadsService.upload(file.buffer, {
      folder: "vtracker/vehicles",
      transformation: [{ width: 800, crop: "limit" }],
    });

    return { success: true, data: result };
  }

  @Throttle({ upload: { ttl: 3_600_000, limit: 30 } })
  @UseInterceptors(FileInterceptor("image"))
  @Post("avatar")
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    this.assertFile(file);

    const result = await this.uploadsService.upload(file.buffer, {
      folder: "vtracker/avatars",
      transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
    });

    return { success: true, data: result };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Delete(":publicId")
  async deleteAsset(@Param("publicId") publicId: string) {
    await this.uploadsService.delete(publicId);

    return { success: true, data: null };
  }

  private assertFile(file: Express.Multer.File | undefined): asserts file {
    if (!file) {
      throw new BadRequestException("Image file is required");
    }
  }
}
