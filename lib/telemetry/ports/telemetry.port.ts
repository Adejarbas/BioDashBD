export interface ITelemetryPort {
  readonly providerName: string;
  init(): void;
  isInitialized(): boolean;
}

export type ITelemetry = ITelemetryPort;

