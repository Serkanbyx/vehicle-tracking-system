import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface PinoRequest extends Omit<Request, "id"> {
  id?: string;
}

interface PostgresError {
  code: string;
  detail?: string;
}

const POSTGRES_ERROR_MAP: Record<string, { status: number; message: string }> = {
  "23505": {
    status: HttpStatus.CONFLICT,
    message: "Resource already exists",
  },
  "23503": {
    status: HttpStatus.BAD_REQUEST,
    message: "Referenced resource does not exist",
  },
  "23502": {
    status: HttpStatus.BAD_REQUEST,
    message: "Required field is missing",
  },
};

const isProduction = () => process.env.NODE_ENV === "production";

const isPostgresError = (error: unknown): error is PostgresError =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as PostgresError).code === "string";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<PinoRequest>();
    const requestId = request.id ?? String(Date.now());

    const { status, message, errors } = this.resolveException(exception, requestId);

    const body: Record<string, unknown> = {
      success: false,
      message,
      requestId,
    };

    if (errors) {
      body.errors = errors;
    }

    if (!isProduction() && exception instanceof Error) {
      body.stack = exception.stack;
    }

    this.logger.error(
      {
        requestId,
        method: request.method,
        url: request.url,
        status,
        message,
      },
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(body);
  }

  private resolveException(
    exception: unknown,
    requestId: string,
  ): {
    status: number;
    message: string;
    errors?: unknown[];
  } {
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    if (isPostgresError(exception)) {
      return this.handlePostgresError(exception);
    }

    if (this.isJwtError(exception)) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "Invalid or expired token",
      };
    }

    this.logger.fatal(
      `Unhandled exception [${requestId}]: ${exception instanceof Error ? exception.message : String(exception)}`,
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProduction()
        ? "Internal server error"
        : ((exception as Error)?.message ?? "Internal server error"),
    };
  }

  private handleHttpException(exception: HttpException): {
    status: number;
    message: string;
    errors?: unknown[];
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === "string") {
      return { status, message: exceptionResponse };
    }

    const res = exceptionResponse as Record<string, unknown>;
    const message =
      typeof res.message === "string"
        ? res.message
        : (Array.isArray(res.message) && res.message[0]) ||
          exception.message ||
          "An error occurred";

    const errors = Array.isArray(res.message) ? res.message : undefined;

    return { status, message: String(message), errors };
  }

  private handlePostgresError(error: PostgresError): {
    status: number;
    message: string;
  } {
    const mapped = POSTGRES_ERROR_MAP[error.code];

    if (mapped) {
      return {
        status: mapped.status,
        message: isProduction()
          ? mapped.message
          : `${mapped.message}: ${error.detail ?? error.code}`,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProduction() ? "Internal server error" : `Database error: ${error.code}`,
    };
  }

  private isJwtError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const jwtErrorNames = ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"];
    return jwtErrorNames.includes(error.name);
  }
}
