import logger from "@/lib/logger/logger.factory";
import { ITelemetryPort } from "../ports/telemetry.port";

export class LocalTelemetryAdapter implements ITelemetryPort {
  readonly providerName = "local-noop";
  private initialized = false;

  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    logger.info(
      "Starting BioDash API — Telemetria inicializada em modo local (LocalTelemetryAdapter)",
      { telemetryProvider: this.providerName }
    );
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

