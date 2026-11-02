import { ILoggerPort, LogMetadata } from "../ports/logger.port";

export class ConsoleLoggerAdapter implements ILoggerPort {
  readonly providerName = "console";

  private formatLine(level: string, message: string, meta?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const payload = {
      service: "biodash-backend",
      environment: process.env.NODE_ENV || "development",
      ...(meta || {}),
    };
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(payload)}`;
  }

  info(message: string, meta?: LogMetadata): void {
    console.log(this.formatLine("info", message, meta));
  }

  warn(message: string, meta?: LogMetadata): void {
    console.warn(this.formatLine("warn", message, meta));
  }

  error(message: string, meta?: LogMetadata): void {
    console.error(this.formatLine("error", message, meta));
  }

  debug(message: string, meta?: LogMetadata): void {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(this.formatLine("debug", message, meta));
    }
  }
}

