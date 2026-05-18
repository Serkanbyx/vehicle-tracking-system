import "./instrumentation";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { WsAdapter } from "@nestjs/platform-ws";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    cors: {
      origin: clientUrl,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  app.useLogger(app.get(Logger));
  app.useWebSocketAdapter(new WsAdapter(app));

  const config = app.get(ConfigService);
  const port = config.get<number>("app.port", 5000);

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());

  app.setGlobalPrefix("api", {
    exclude: [{ path: "/", method: RequestMethod.GET }],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Vehicle Tracking System")
    .setDescription(
      "Fleet visibility API with live GPS updates, geofences, alerts, trips, exports, and role-based access control.",
    )
    .setVersion(process.env.npm_package_version || "0.0.1")
    .setContact("Serkanby", "https://serkanbayraktar.com/", "")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "JWT")
    .addCookieAuth("refreshToken", { type: "apiKey", in: "cookie" }, "RefreshCookie")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "method",
    },
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  app.useBodyParser("json", { limit: "10kb" });
  app.useBodyParser("urlencoded", { limit: "10kb", extended: true });

  app.disable("x-powered-by");

  await app.listen(port);
}

bootstrap();
