import { ILogger, ILoggerPort, LogMetadata } from "./ports/logger.port";
import { WinstonOtelLoggerAdapter } from "./adapters/winston-otel.adapter";
import { ConsoleLoggerAdapter } from "./adapters/console-logger.adapter";

let instance: ILoggerPort | null = null;

export function getLoggerService(): ILogger {
  if (!instance) {
    const provider = (process.env.LOGGER_PROVIDER || "winston").toLowerCase().trim();

    if (provider === "console") {
      instance = new ConsoleLoggerAdapter();
    } else {
      instance = new WinstonOtelLoggerAdapter();
    }
  }
  return instance;
}

export const logger: ILogger = {
  get providerName() {
    return getLoggerService().providerName;
  },
  info: (message: string, meta?: LogMetadata) => getLoggerService().info(message, meta),
  warn: (message: string, meta?: LogMetadata) => getLoggerService().warn(message, meta),
  error: (message: string, meta?: LogMetadata) => getLoggerService().error(message, meta),
  debug: (message: string, meta?: LogMetadata) => getLoggerService().debug(message, meta),
};

export default logger;
export { type ILogger, type ILoggerPort, type LogMetadata };

