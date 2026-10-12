/**
 * Instrumentação e Inicialização do OpenTelemetry para Azure Monitor / Application Insights
 * Padrões Abertos (OTel) sem acoplamento proprietário da AWS (CloudWatch / AWS X-Ray removidos).
 */
import { useAzureMonitor } from '@azure/monitor-opentelemetry';

let isInitialized = false;

export function initTelemetry() {
  if (isInitialized) {
    return;
  }

  const connectionString =
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
    process.env.APPINSIGHTS_CONNECTIONSTRING;

  if (connectionString) {
    try {
      useAzureMonitor({
        azureMonitorExporterOptions: {
          connectionString: connectionString,
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
      isInitialized = true;
      console.log('✅ [OpenTelemetry] Azure Monitor / Application Insights instrumentado com sucesso (BioDashBD).');
    } catch (err: any) {
      console.warn('⚠️ [OpenTelemetry] Falha ao inicializar Azure Monitor OTel:', err?.message || err);
    }
  } else {
    console.info('ℹ️ [OpenTelemetry] APPLICATIONINSIGHTS_CONNECTION_STRING não informada. Telemetria Azure Monitor desativada localmente.');
  }
}
