import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { MoblinTelemetryData } from '../types/moblin';
import type { CyclingData, CyclingHudConfig, PauseInfo } from '../components/cycling/CyclingHud';
import { parseMessage, isSystemMessageType, HeheChatMessage } from '../commons/message';

interface Sections {
  enabled: boolean;
  location: boolean;
  distance: boolean;
  speed: boolean;
  gradient: boolean;
  elevation: boolean;
  split: boolean;
  debug: boolean;
}

const defaultSections: Sections = {
  enabled: true,
  location: true,
  distance: true,
  speed: true,
  gradient: true,
  elevation: true,
  split: false,
  debug: false,
};

// profile.config keys carrying each section's toggle, set via Settings > Connect > Moblin
const CONFIG_KEYS: Record<keyof Sections, string> = {
  enabled: 'cyclingHudEnabled',
  location: 'cyclingHudLocation',
  distance: 'cyclingHudDistance',
  speed: 'cyclingHudSpeed',
  gradient: 'cyclingHudGradient',
  elevation: 'cyclingHudElevation',
  split: 'cyclingHudSplit',
  debug: 'cyclingHudDebug',
};

function sectionsFromConfig(profileConfig: Record<string, unknown> | undefined): Sections {
  const result = { ...defaultSections };
  for (const key of Object.keys(CONFIG_KEYS) as (keyof Sections)[]) {
    const value = profileConfig?.[CONFIG_KEYS[key]];
    if (typeof value === 'boolean') result[key] = value;
  }
  return result;
}

interface Thresholds {
  delaySeconds: number;
  minSpeedKmh: number;
  minGradientPercent: number;
  gradientOnlyWhenMoving: boolean;
  hideLingerSeconds: number;
  pauseEnabled: boolean;
  pauseStartAfterSeconds: number;
  pauseResumeSpeedKmh: number;
  pauseMinDistanceM: number;
}

const defaultThresholds: Thresholds = {
  delaySeconds: 10,
  minSpeedKmh: 1,
  minGradientPercent: 1,
  gradientOnlyWhenMoving: true,
  hideLingerSeconds: 10,
  pauseEnabled: false,
  pauseStartAfterSeconds: 30,
  pauseResumeSpeedKmh: 5,
  pauseMinDistanceM: 100,
};

// profile.config keys carrying each threshold, set via Settings > Connect > Moblin
const THRESHOLD_CONFIG_KEYS: Record<keyof Thresholds, string> = {
  delaySeconds: 'cyclingHudDelaySeconds',
  minSpeedKmh: 'cyclingHudMinSpeedKmh',
  minGradientPercent: 'cyclingHudMinGradientPercent',
  gradientOnlyWhenMoving: 'cyclingHudGradientOnlyWhenMoving',
  hideLingerSeconds: 'cyclingHudHideLingerSeconds',
  pauseEnabled: 'cyclingHudPauseEnabled',
  pauseStartAfterSeconds: 'cyclingHudPauseStartAfterSeconds',
  pauseResumeSpeedKmh: 'cyclingHudPauseResumeSpeedKmh',
  pauseMinDistanceM: 'cyclingHudPauseMinDistanceM',
};

const THRESHOLD_BOOLEAN_KEYS: (keyof Thresholds)[] = ['gradientOnlyWhenMoving', 'pauseEnabled'];

function thresholdsFromConfig(profileConfig: Record<string, unknown> | undefined): Thresholds {
  const result: Record<string, unknown> = { ...defaultThresholds };
  for (const key of Object.keys(THRESHOLD_CONFIG_KEYS) as (keyof Thresholds)[]) {
    const value = profileConfig?.[THRESHOLD_CONFIG_KEYS[key]];
    const expectBoolean = THRESHOLD_BOOLEAN_KEYS.includes(key);
    if (typeof value === (expectBoolean ? 'boolean' : 'number')) result[key] = value;
  }
  return result as unknown as Thresholds;
}

const emptyPause: PauseInfo = { onBreak: false, currentBreakSeconds: 0, totalBreakSeconds: 0 };

type PauseThresholds = Pick<
  Thresholds,
  'pauseEnabled' | 'minSpeedKmh' | 'pauseStartAfterSeconds' | 'pauseResumeSpeedKmh' | 'pauseMinDistanceM'
>;

// tracks stopped time as "breaks": counts once stopped for pauseStartAfterSeconds, and only
// ends once speed clears pauseResumeSpeedKmh - so briefly walking the bike around (GPS still
// moving at walking pace) doesn't end the break early. Also requires pauseMinDistanceM of riding
// since the ride start (or since the previous break ended) before a break can start, so idling
// before setting off - or a quick on/off-the-bike shuffle - doesn't get counted
function usePauseTracking(
  speedKmh: number,
  distanceKm: number,
  thresholds: PauseThresholds
): PauseInfo {
  const [pause, setPause] = useState<PauseInfo>(emptyPause);
  const speedRef = useRef(speedKmh);
  speedRef.current = speedKmh;
  const distanceRef = useRef(distanceKm);
  distanceRef.current = distanceKm;

  const {
    pauseEnabled, minSpeedKmh, pauseStartAfterSeconds, pauseResumeSpeedKmh, pauseMinDistanceM,
  } = thresholds;

  useEffect(() => {
    if (!pauseEnabled) {
      setPause(emptyPause);
      return undefined;
    }

    let notMovingSince: number | null = null;
    let breakStart: number | null = null;
    let totalBreakMs = 0;
    let baselineDistanceKm: number | null = null;

    const id = setInterval(() => {
      const now = Date.now();
      const speed = speedRef.current;
      const distance = distanceRef.current;

      if (baselineDistanceKm === null) baselineDistanceKm = distance;
      const riddenEnough = distance - baselineDistanceKm >= pauseMinDistanceM / 1000;

      if (breakStart === null) {
        if (riddenEnough && speed < minSpeedKmh) {
          if (notMovingSince === null) notMovingSince = now;
          if (now - notMovingSince >= pauseStartAfterSeconds * 1000) breakStart = notMovingSince;
        } else {
          notMovingSince = null;
        }
      } else if (speed >= pauseResumeSpeedKmh) {
        totalBreakMs += now - breakStart;
        breakStart = null;
        notMovingSince = null;
        baselineDistanceKm = distance;
      }

      const currentBreakMs = breakStart !== null ? now - breakStart : 0;
      setPause({
        onBreak: breakStart !== null,
        currentBreakSeconds: Math.floor(currentBreakMs / 1000),
        totalBreakSeconds: Math.floor((totalBreakMs + currentBreakMs) / 1000),
      });
    }, 1000);

    return () => clearInterval(id);
  }, [pauseEnabled, minSpeedKmh, pauseStartAfterSeconds, pauseResumeSpeedKmh, pauseMinDistanceM]);

  return pause;
}

function getQueryVariable(query: string, variable: string): string | undefined {
  for (const pair of query.split('&')) {
    const [key, value] = pair.split('=');
    if (decodeURIComponent(key) === variable) return decodeURIComponent(value);
  }
  return undefined;
}

function toLocation(t: MoblinTelemetryData): string {
  const parts = [t.data.city, t.data.area, t.data.state, t.data.country].filter(Boolean);
  return parts.length ? parts[0]! : '—';
}

// telemetry fields can be null/missing on individual messages - fall back to 0 rather than crash on NaN
function num(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toCyclingData(t: MoblinTelemetryData): CyclingData {
  return {
    speedKmh: num(t.data.speed) * 3.6,
    distanceKm: num(t.data.distance) / 1000,
    splitDistanceKm: num(t.data.splitDistance) / 1000,
    location: toLocation(t),
    gradientPercent: num(t.data.slopePercent),
    elevationGainM: num(t.data.altitudeAscent),
    elevationLossM: num(t.data.altitudeDescent),
    splitElevationGainM: num(t.data.splitAltitudeAscent),
    splitElevationLossM: num(t.data.splitAltitudeDescent),
  };
}

export type MoblinConnectionStatus = 'waiting' | 'subscribed' | 'error';

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const RECONNECT_BACKOFF = 1.5;

function calcReconnectDelay(attempts: number): number {
  const delay = INITIAL_RECONNECT_DELAY_MS * RECONNECT_BACKOFF ** attempts;
  return Math.min(delay, MAX_RECONNECT_DELAY_MS);
}

// on-screen debug info since browser sources in OBS have no reachable devtools
export interface MoblinDebugInfo {
  telemetryCount: number;
  chatCount: number;
  lastChatUser: string | null;
  lastChatText: string | null;
  lastMessageError: string | null;
  lastChatRaw: string | null;
  lastTelemetryRaw: string | null;
}

const emptyDebug: MoblinDebugInfo = {
  telemetryCount: 0,
  chatCount: 0,
  lastChatUser: null,
  lastChatText: null,
  lastMessageError: null,
  lastChatRaw: null,
  lastTelemetryRaw: null,
};

// dumps the actual payload shape on screen so we can see real key names without devtools
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function useMoblinCyclingHud(): {
  data: CyclingData | null;
  config: CyclingHudConfig;
  pause: PauseInfo;
  status: MoblinConnectionStatus;
  error: string | null;
  debug: MoblinDebugInfo;
  debugVisible: boolean;
} {
  const [data, setData] = useState<CyclingData | null>(null);
  const [sections, setSections] = useState<Sections>(defaultSections);
  const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds);
  const [status, setStatus] = useState<MoblinConnectionStatus>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<MoblinDebugInfo>(emptyDebug);
  // telemetry is buffered here and released after delaySeconds, to line the HUD up with the
  // stream's video delay - see the flush effect below
  const bufferRef = useRef<{ t: number; data: CyclingData }[]>([]);

  // telemetry comes from HeheServer over a plain WebSocket, using the same
  // browser-source sink token as chat/alert sources - independent of any Moblin browser-source
  // lifecycle, so both keep updating while backgrounded/not rendered by Moblin
  useEffect(() => {
    const token = getQueryVariable(window.location.hash.substring(1), 'token');

    if (!token) {
      setStatus('error');
      setError('Fehlender Token - wurde diese URL aus HeheChat > Settings > Connect > Moblin kopiert?');
      return undefined;
    }

    const heheWsUrl = import.meta.env.VITE_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(heheWsUrl);

      ws.addEventListener('open', () => {
        attempts = 0;
        ws!.send(JSON.stringify({ type: 'sink', source: 'Telemetry HUD', token }));
        setStatus('subscribed');
        setError(null);
      });

      ws.addEventListener('message', (event) => {
        let msg: {
          type?: string;
          data?: MoblinTelemetryData['data'] & { message?: string };
          profile?: { config?: Record<string, unknown> & { channels?: string[] } };
        };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === 'heartbeat') {
          ws!.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // sharedata arrives right after the sink handshake - use it to subscribe to the
        // channel(s) we belong to (starts the telemetry feed) and to read the HUD section
        // toggles from Settings > Connect > Moblin
        if (msg.type === 'sharedata') {
          const channels = msg.profile?.config?.channels ?? [];
          if (channels.length) {
            ws!.send(JSON.stringify({
              type: 'subscribe',
              token,
              channels: Object.fromEntries(channels.map((c) => [c, true])),
            }));
          }
          setSections(sectionsFromConfig(msg.profile?.config));
          setThresholds(thresholdsFromConfig(msg.profile?.config));
          return;
        }

        // chat itself isn't used for HUD control anymore (moved to Settings > Connect > Moblin),
        // but keep receiving it - a future feature will show chat overlaid on the HUD
        if (msg.type === 'msg') {
          handleIncomingChat(msg.data?.message, setDebug);
          return;
        }

        if (msg.type === 'Telemetry' && msg.data) {
          setDebug((d) => ({
            ...d,
            telemetryCount: d.telemetryCount + 1,
            lastTelemetryRaw: safeStringify(msg.data),
          }));
          bufferRef.current.push({ t: Date.now(), data: toCyclingData({ data: msg.data }) });
        }
      });

      ws.addEventListener('close', () => {
        if (cancelled) return;
        setStatus('waiting');
        const delay = calcReconnectDelay(attempts);
        attempts += 1;
        reconnectTimer = setTimeout(connect, delay);
      });
    }

    connect();

    function onVisible() {
      if (document.visibilityState === 'visible' && ws?.readyState !== WebSocket.OPEN) {
        clearTimeout(reconnectTimer);
        connect();
      }
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      document.removeEventListener('visibilitychange', onVisible);
      ws?.close();
    };
  }, []);

  // releases buffered telemetry once it's old enough, so the HUD lags behind live by delaySeconds
  useEffect(() => {
    const delayMs = thresholds.delaySeconds * 1000;
    const id = setInterval(() => {
      const now = Date.now();
      const buffer = bufferRef.current;
      let released: CyclingData | undefined;
      while (buffer.length && now - buffer[0].t >= delayMs) {
        released = buffer.shift()!.data;
      }
      if (released) setData(released);
    }, 200);
    return () => clearInterval(id);
  }, [thresholds.delaySeconds]);

  const pause = usePauseTracking(data?.speedKmh ?? 0, data?.distanceKm ?? 0, thresholds);

  const config: CyclingHudConfig = {
    visible: {
      speed: sections.enabled && sections.speed,
      distance: sections.enabled && sections.distance,
      location: sections.enabled && sections.location,
      gradient: sections.enabled && sections.gradient,
      elevation: sections.enabled && sections.elevation,
      split: sections.split,
    },
    minSpeedKmh: thresholds.minSpeedKmh,
    minGradientPercent: thresholds.minGradientPercent,
    gradientOnlyWhenMoving: thresholds.gradientOnlyWhenMoving,
    hideLingerMs: thresholds.hideLingerSeconds * 1000,
  };

  return { data, config, pause, status, error, debug, debugVisible: sections.debug };
}

// a bad chat payload here must never break the WS message pipe or crash the page
function handleIncomingChat(
  rawLine: string | undefined,
  setDebug: Dispatch<SetStateAction<MoblinDebugInfo>>
) {
  if (!rawLine) return;
  try {
    const msg = parseMessage(rawLine);
    if (isSystemMessageType(msg)) return;
    const chat = msg as HeheChatMessage;
    setDebug((d) => ({
      ...d,
      chatCount: d.chatCount + 1,
      lastChatUser: chat.userInfo?.userName ?? null,
      lastChatText: chat.text,
      lastChatRaw: safeStringify(rawLine),
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setDebug((d) => ({ ...d, lastMessageError: msg }));
  }
}
