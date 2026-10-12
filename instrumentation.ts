/**
 * Next.js Instrumentation Hook
 * Executa uma única vez no startup do servidor Node.js
 * Inicia OpenTelemetry antes de qualquer requisição ou conexão com banco de dados.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTelemetry } = await import('@/lib/telemetry');
    initTelemetry();
  }
}
