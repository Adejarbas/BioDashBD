import { useAzureMonitor } from "@azure/monitor-opentelemetry";
import logger from "@/lib/logger/logger.factory";
import { ITelemetryPort } from "../ports/telemetry.port";

export class AzureMonitorTelemetryAdapter implements ITelemetryPort {
  readonly providerName = "azure-monitor-otel";
  private initialized = false;

  init(): void {
    if (this.initialized) {
      return;
    }

    const connectionString =
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
      process.env.APPINSIGHTS_CONNECTIONSTRING;

    if (!connectionString) {
      logger.warn(
        "Starting BioDash API — APPLICATIONINSIGHTS_CONNECTION_STRING ausente no AzureMonitorTelemetryAdapter",
        { telemetryProvider: this.providerName }
      );
      return;
    }

    try {
      useAzureMonitor({
        azureMonitorExporterOptions: {
          connectionString,
        },
        samplingRatio: 1.0,
        instrumentationOptions: {
          http: { enabled: true },
          azureSdk: { enabled: true },
          postgreSql: { enabled: true },
          bunyan: { enabled: false },
          winston: { enabled: true },
        },
      });
      this.initialized = true;
      logger.info(
        "Starting BioDash API — OpenTelemetry (Azure Monitor / Application Insights) instrumentado com sucesso",
        { telemetryProvider: this.providerName }
      );
    } catch (err: any) {
      logger.warn("Falha ao inicializar Azure Monitor OpenTelemetry", {
        telemetryProvider: this.providerName,
        error: err?.message || String(err),
      });
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

