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

function toCyclingData(t: MoblinTelemetryData): CyclingData {
  return {
    speedKmh: t.speed * 3.6,
    dayDistanceKm: t.splitDistance / 1000,
    totalDistanceKm: t.distance / 1000,
    location: toLocation(t),
    gradientPercent: t.slopePercent,
    elevationGainM: t.altitudeAscent,
    elevationLossM: t.altitudeDescent,
  };
}

export function useMoblinCyclingHud(): { data: CyclingData | null; config: CyclingHudConfig } {
  const [data, setData] = useState<CyclingData | null>(null);
  const [sections, setSections] = useState<Sections>(loadSections);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    const { moblin } = window;
    if (!moblin) return undefined;

    moblin.subscribe({ chat: { prefix: '!' }, telemetry: {} });
    moblin.onmessage = (message) => {
      if (message.telemetry) {
        setData(toCyclingData(message.telemetry));
      }
      if (message.chat) {
        handleChatCommand(message.chat, setSections);
      }
    };

    return () => {
      moblin.onmessage = null;
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

  return { data, config };
}

function handleChatCommand(
  chat: { user: string; segments: { text?: string }[] },
  setSections: Dispatch<SetStateAction<Sections>>
) {
  if (!ALLOWED_USERS.includes(chat.user.toLowerCase())) return;

  const text = chat.segments
    .map((s) => s.text ?? '')
    .join('')
    .trim();
  const [rawCommand, rawArg] = text.slice(1).split(/\s+/);
  const key = COMMANDS[rawCommand?.toLowerCase()];
  if (!key) return;
  if (rawArg !== 'on' && rawArg !== 'off') return;

  setSections((prev) => ({ ...prev, [key]: rawArg === 'on' }));
}
