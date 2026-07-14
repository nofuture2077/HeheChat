import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { MoblinTelemetryData } from '../types/moblin';
import type { CyclingData, CyclingHudConfig } from '../components/cycling/CyclingHud';

// only this streamer may issue chat commands, checked case-insensitively against the chat display name
const ALLOWED_USERS = ['nofuture2077'];
const STORAGE_KEY = 'cyclingHud.sections';
const MIN_SPEED_KMH = 10;
const MIN_GRADIENT_PERCENT = 2;

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

// whitelist of chat commands, each toggles exactly one section key - never eval chat text
const COMMANDS: Record<string, keyof Sections> = {
  telemetry: 'enabled',
  location: 'location',
  distance: 'distance',
  speed: 'speed',
  gradient: 'gradient',
  elevation: 'elevation',
  ascent: 'elevation',
  split: 'split',
  debug: 'debug',
};

function getQueryVariable(query: string, variable: string): string | undefined {
  for (const pair of query.split('&')) {
    const [key, value] = pair.split('=');
    if (decodeURIComponent(key) === variable) return decodeURIComponent(value);
  }
  return undefined;
}

function loadSections(): Sections {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSections;
    return { ...defaultSections, ...JSON.parse(raw) };
  } catch {
    return defaultSections;
  }
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

// moblin is injected as a bare script-global at some point after load, so retry until it shows up
const MOBLIN_POLL_INTERVAL_MS = 50;
const MOBLIN_WAIT_TIMEOUT_MS = 8000;

// on-screen debug info since browser sources in OBS have no reachable devtools
export interface MoblinDebugInfo {
  telemetryCount: number;
  chatCount: number;
  lastChatUser: string | null;
  lastChatText: string | null;
  lastRejectedUser: string | null;
  lastMessageError: string | null;
  lastChatRaw: string | null;
  lastTelemetryRaw: string | null;
}

const emptyDebug: MoblinDebugInfo = {
  telemetryCount: 0,
  chatCount: 0,
  lastChatUser: null,
  lastChatText: null,
  lastRejectedUser: null,
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
  status: MoblinConnectionStatus;
  error: string | null;
  debug: MoblinDebugInfo;
  debugVisible: boolean;
} {
  const [data, setData] = useState<CyclingData | null>(null);
  const [sections, setSections] = useState<Sections>(loadSections);
  const [status, setStatus] = useState<MoblinConnectionStatus>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<MoblinDebugInfo>(emptyDebug);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  // telemetry comes from HeheServer over a plain WebSocket, using the same browser-source
  // sink token as chat/alert sources - independent of any Moblin browser-source lifecycle,
  // so it keeps updating while backgrounded/not rendered by Moblin
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
        ws!.send(JSON.stringify({ type: 'sink', token }));
        setStatus('subscribed');
        setError(null);
      });

      ws.addEventListener('message', (event) => {
        let msg: { type?: string; data?: MoblinTelemetryData['data'] };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === 'heartbeat') {
          ws!.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (msg.type === 'Telemetry' && msg.data) {
          setDebug((d) => ({
            ...d,
            telemetryCount: d.telemetryCount + 1,
            lastTelemetryRaw: safeStringify(msg.data),
          }));
          setData(toCyclingData({ data: msg.data }));
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

  // HUD toggle chat commands still come from Moblin's own browser-source chat relay
  // (unaffected by the telemetry-backgrounding bug) - best effort, no error UI if absent
  useEffect(() => {
    let cancelled = false;
    let retryId: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + MOBLIN_WAIT_TIMEOUT_MS;

    function waitForMoblin() {
      if (cancelled) return;
      if (typeof moblin === 'undefined') {
        if (Date.now() <= deadline) retryId = setTimeout(waitForMoblin, MOBLIN_POLL_INTERVAL_MS);
        return;
      }
      try {
        const prevOnMessage = moblin.onmessage;
        moblin.onmessage = (message) => {
          prevOnMessage?.(message);
          if (!message.chat) return;
          try {
            const chat = message.chat.message;
            setDebug((d) => ({
              ...d,
              chatCount: d.chatCount + 1,
              lastChatUser: chat?.user ?? null,
              lastChatText: segmentsToText(chat?.segments),
              lastChatRaw: safeStringify(message.chat),
            }));
            handleChatCommand(chat, setSections, (rejectedUser) =>
              setDebug((d) => ({ ...d, lastRejectedUser: rejectedUser }))
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setDebug((d) => ({ ...d, lastMessageError: msg }));
          }
        };
        moblin.subscribe({ chat: { prefix: '!' } });
      } catch {
        // Moblin chat relay is optional - telemetry doesn't depend on it
      }
    }

    waitForMoblin();

    return () => {
      cancelled = true;
      clearTimeout(retryId);
    };
  }, []);

  const config: CyclingHudConfig = {
    visible: {
      speed: sections.enabled && sections.speed,
      distance: sections.enabled && sections.distance,
      location: sections.enabled && sections.location,
      gradient: sections.enabled && sections.gradient,
      elevation: sections.enabled && sections.elevation,
      split: sections.split,
    },
    minSpeedKmh: MIN_SPEED_KMH,
    minGradientPercent: MIN_GRADIENT_PERCENT,
  };

  return { data, config, status, error, debug, debugVisible: sections.debug };
}

// segments can be missing/malformed on a given payload - never crash the message pipe over it
function segmentsToText(segments: { text?: string }[] | undefined): string {
  if (!Array.isArray(segments)) return '';
  return segments.map((s) => s?.text ?? '').join('');
}

function handleChatCommand(
  chat: { user: string; segments: { text?: string }[] } | undefined,
  setSections: Dispatch<SetStateAction<Sections>>,
  onRejected: (user: string) => void
) {
  if (!chat) return;
  const user = (chat.user ?? '').trim().toLowerCase();
  if (!ALLOWED_USERS.includes(user)) {
    onRejected(chat.user ?? '');
    return;
  }

  const text = segmentsToText(chat.segments).trim();
  const withoutPrefix = text.startsWith('!') ? text.slice(1) : text;
  const [rawCommand, rawArg] = withoutPrefix.split(/\s+/);
  const key = COMMANDS[rawCommand?.toLowerCase()];
  if (!key) return;
  if (rawArg !== 'on' && rawArg !== 'off') return;

  setSections((prev) => ({ ...prev, [key]: rawArg === 'on' }));
}
