import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { map, type Observable } from "rxjs";

interface MetaResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

const hasMetaKey = (value: unknown): value is MetaResponse<unknown> =>
  typeof value === "object" && value !== null && "data" in value && "meta" in value;

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        const res = context.switchToHttp().getResponse<Response>();
        const contentType = res.getHeader("content-type");

        if (typeof contentType === "string" && contentType.includes("text/html")) {
          return value;
        }

        if (hasMetaKey(value)) {
          return {
            success: true,
            data: value.data,
            meta: value.meta,
          };
        }

        return {
          success: true,
          data: value,
        };
      }),
    );
  }
}
