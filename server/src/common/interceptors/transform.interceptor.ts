import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { type Observable, map } from "rxjs";

interface MetaResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

const hasMetaKey = (value: unknown): value is MetaResponse<unknown> =>
  typeof value === "object" &&
  value !== null &&
  "data" in value &&
  "meta" in value;

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Record<string, unknown>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Record<string, unknown>> {
    return next.handle().pipe(
      map((value) => {
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
