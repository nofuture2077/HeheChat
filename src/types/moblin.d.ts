export interface MoblinTelemetryData {
  speed: number;
  averageSpeed: number;
  altitude: number;
  latitude: number | null;
  longitude: number | null;
  distance: number;
  splitDistance: number;
  slopePercent: number;
  altitudeAscent: number;
  altitudeDescent: number;
  splitAltitudeAscent: number;
  splitAltitudeDescent: number;
  temperature: number | null;
  feelsLikeTemperature: number | null;
  windSpeed: number | null;
  windGust: number | null;
  country: string | null;
  countryFlag: string | null;
  state: string | null;
  area: string | null;
  city: string | null;
  neighborhood: string | null;
  heartRates: Record<string, number | null>;
  activeEnergyBurned: number | null;
  workoutDistance: number | null;
  power: number | null;
  stepCount: number | null;
  cyclingPower: number;
  cyclingCadence: number;
  runningMetrics: Record<string, { speed?: number; cadence?: number; distance?: number }>;
  gForce: { now: number; recentMax: number; max: number } | null;
}

export interface MoblinChatPostSegment {
  text?: string;
  emote?: string;
}

export interface MoblinChatMessage {
  user: string;
  segments: MoblinChatPostSegment[];
}

export interface MoblinMessage {
  chat?: MoblinChatMessage;
  telemetry?: MoblinTelemetryData;
}

export interface MoblinApi {
  subscribeTelemetry: (callback: (data: MoblinTelemetryData) => void) => void;
  subscribe: (options: { chat?: { prefix: string }; telemetry?: Record<string, never> }) => void;
  onmessage: ((data: MoblinMessage) => void) | null;
}

declare global {
  // injected as a bare script-global at document-start, not on window - always guard with
  // `typeof moblin !== 'undefined'`, a direct reference throws ReferenceError before that
  const moblin: MoblinApi;
}
