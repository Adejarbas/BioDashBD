/**
 * Ponto de entrada da Observabilidade e OpenTelemetry (Ports & Adapters).
 * Delega para a factory de telemetria (Azure Monitor OTel ou Local Fallback).
 */
import { getTelemetryService, type ITelemetry, type ITelemetryPort } from "@/lib/telemetry/telemetry.factory";

export function initTelemetry(): void {
  const telemetry = getTelemetryService();
  telemetry.init();
}

export { getTelemetryService, type ITelemetry, type ITelemetryPort };
