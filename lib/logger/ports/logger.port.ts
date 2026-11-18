export type LogMetadata = Record<string, unknown>;

export interface ILoggerPort {
  readonly providerName: string;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
}

export type ILogger = ILoggerPort;

