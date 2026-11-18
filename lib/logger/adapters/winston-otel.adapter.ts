import winston from "winston";
import { trace } from "@opentelemetry/api";
import { ILoggerPort, LogMetadata } from "../ports/logger.port";

function getOtelContextMeta(): LogMetadata {
  try {
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) return {};
    const spanContext = activeSpan.spanContext();
    if (!spanContext?.traceId) return {};
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  } catch {
    return {};
  }
}

export class WinstonOtelLoggerAdapter implements ILoggerPort {
  readonly providerName = "winston-otel";
  private baseLogger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [new winston.transports.Console()];

    this.baseLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...rest }) => {
          const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
          return `[${timestamp}] ${level.toUpperCase()}: ${message}${meta}`;
        })
      ),
      transports,
    });
  }

  private enrichMeta(meta?: LogMetadata): LogMetadata {
    return {
      service: "biodash-backend",
      environment: process.env.NODE_ENV || "development",
      ...getOtelContextMeta(),
      ...(meta || {}),
    };
  }

  info(message: string, meta?: LogMetadata): void {
    this.baseLogger.info(message, this.enrichMeta(meta));
  }

  warn(message: string, meta?: LogMetadata): void {
    this.baseLogger.warn(message, this.enrichMeta(meta));
  }

  error(message: string, meta?: LogMetadata): void {
    this.baseLogger.error(message, this.enrichMeta(meta));
  }

  debug(message: string, meta?: LogMetadata): void {
    this.baseLogger.debug(message, this.enrichMeta(meta));
  }
}

