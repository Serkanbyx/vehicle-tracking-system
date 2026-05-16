import "./instrumentation";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { WsAdapter } from "@nestjs/platform-ws";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.useWebSocketAdapter(new WsAdapter(app));

  const config = app.get(ConfigService);
  const port = config.get<number>("app.port", 5000);
  const clientUrl = config.get<string>("app.clientUrl", "http://localhost:3000");

  app.set("trust proxy", 1);

  app.enableCors({
    origin: clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());

  app.setGlobalPrefix("api");

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
