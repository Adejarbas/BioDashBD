import { ITelemetry, ITelemetryPort } from "./ports/telemetry.port";
import { AzureMonitorTelemetryAdapter } from "./adapters/azure-monitor.adapter";
import { LocalTelemetryAdapter } from "./adapters/local-telemetry.adapter";

let instance: ITelemetryPort | null = null;

export function getTelemetryService(): ITelemetry {
  if (!instance) {
    const provider = (process.env.TELEMETRY_PROVIDER || "").toLowerCase().trim();
    const hasAzureConnectionString = Boolean(
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
        process.env.APPINSIGHTS_CONNECTIONSTRING
    );

    if (provider === "azure" || (!provider && hasAzureConnectionString)) {
      instance = new AzureMonitorTelemetryAdapter();
    } else {
      instance = new LocalTelemetryAdapter();
    }
  }
  return instance;
}

export { type ITelemetry, type ITelemetryPort };

