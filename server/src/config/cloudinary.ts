import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY = "CLOUDINARY";

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (cfg: ConfigService) => {
    cloudinary.config({
      cloud_name: cfg.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: cfg.get<string>("CLOUDINARY_API_KEY"),
      api_secret: cfg.get<string>("CLOUDINARY_API_SECRET"),
      secure: true,
    });

    return cloudinary;
  },
  inject: [ConfigService],
};
