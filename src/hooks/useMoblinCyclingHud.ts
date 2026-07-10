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
}

const defaultSections: Sections = {
  enabled: true,
  location: true,
  distance: true,
  speed: true,
  gradient: true,
  elevation: true,
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
};

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
  const parts = [t.city, t.area, t.state, t.country].filter(Boolean);
  return parts.length ? parts[0]! : '—';
}

// telemetry fields can be null/missing on individual messages - fall back to 0 rather than crash on NaN
function num(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toCyclingData(t: MoblinTelemetryData): CyclingData {
  return {
    speedKmh: num(t.speed) * 3.6,
    dayDistanceKm: num(t.splitDistance) / 1000,
    totalDistanceKm: num(t.distance) / 1000,
    location: toLocation(t),
    gradientPercent: num(t.slopePercent),
    elevationGainM: num(t.altitudeAscent),
    elevationLossM: num(t.altitudeDescent),
  };
}

export type MoblinConnectionStatus = 'waiting' | 'subscribed' | 'error';

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
}

const emptyDebug: MoblinDebugInfo = {
  telemetryCount: 0,
  chatCount: 0,
  lastChatUser: null,
  lastChatText: null,
  lastRejectedUser: null,
  lastMessageError: null,
};

export function useMoblinCyclingHud(): {
  data: CyclingData | null;
  config: CyclingHudConfig;
  status: MoblinConnectionStatus;
  error: string | null;
  debug: MoblinDebugInfo;
} {
  const [data, setData] = useState<CyclingData | null>(null);
  const [sections, setSections] = useState<Sections>(loadSections);
  const [status, setStatus] = useState<MoblinConnectionStatus>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<MoblinDebugInfo>(emptyDebug);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    let cancelled = false;
    let retryId: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + MOBLIN_WAIT_TIMEOUT_MS;

    function waitForMoblin() {
      if (cancelled) return;
      if (typeof moblin !== 'undefined') {
        subscribe();
        return;
      }
      if (Date.now() > deadline) {
        setStatus('error');
        setError('moblin wurde nicht gefunden - läuft diese Seite als Moblin Browser Source?');
        return;
      }
      retryId = setTimeout(waitForMoblin, MOBLIN_POLL_INTERVAL_MS);
    }

    function subscribe() {
      try {
        moblin.onmessage = (message) => {
          // a bad payload here must never break the moblin message pipe or crash the page
          try {
            if (message.telemetry) {
              setDebug((d) => ({ ...d, telemetryCount: d.telemetryCount + 1 }));
              setData(toCyclingData(message.telemetry));
            } else if (message.chat) {
              setDebug((d) => ({
                ...d,
                chatCount: d.chatCount + 1,
                lastChatUser: message.chat!.user,
                lastChatText: segmentsToText(message.chat!.segments),
              }));
              handleChatCommand(message.chat, setSections, (rejectedUser) =>
                setDebug((d) => ({ ...d, lastRejectedUser: rejectedUser }))
              );
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setDebug((d) => ({ ...d, lastMessageError: msg }));
          }
        };
        moblin.subscribe({ telemetry: {} });
        moblin.subscribe({ chat: { prefix: '!' } });
        setStatus('subscribed');
        setError(null);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    waitForMoblin();

    return () => {
      cancelled = true;
      clearTimeout(retryId);
      if (typeof moblin !== 'undefined') moblin.onmessage = null;
    };
  }, []);

  const config: CyclingHudConfig = {
    visible: {
      speed: sections.enabled && sections.speed,
      dayDistance: sections.enabled && sections.distance,
      totalDistance: sections.enabled && sections.distance,
      location: sections.enabled && sections.location,
      gradient: sections.enabled && sections.gradient,
      elevation: sections.enabled && sections.elevation,
    },
    minSpeedKmh: MIN_SPEED_KMH,
    minGradientPercent: MIN_GRADIENT_PERCENT,
  };

  return { data, config, status, error, debug };
}

// segments can be missing/malformed on a given payload - never crash the message pipe over it
function segmentsToText(segments: { text?: string }[] | undefined): string {
  if (!Array.isArray(segments)) return '';
  return segments.map((s) => s?.text ?? '').join('');
}

function handleChatCommand(
  chat: { user: string; segments: { text?: string }[] },
  setSections: Dispatch<SetStateAction<Sections>>,
  onRejected: (user: string) => void
) {
  const user = (chat.user ?? '').trim().toLowerCase();
  if (!ALLOWED_USERS.includes(user)) {
    onRejected(chat.user);
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
