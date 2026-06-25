import { useViewportSize } from '@mantine/hooks';
import { useEffect } from 'react';

export function param(key: string, value: string) {
    return [key, value].join("=");
}

export function query(params: string[]) {
    return params.join("&");
}

export function toMap<A, K>(arr: A[], func1: (el: A) => K) {
    return arr.reduce((acc, el) => {
        acc.set(func1(el), el);
        return acc;
    }, new Map());
}

export function generateGUID(): string {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

// Levenshtein distance function
export function levenshtein(a: string, b: string) {
    const tmp = [];
    let i, j, alen = a.length, blen = b.length, cost;

    if (alen === 0) return blen;
    if (blen === 0) return alen;

    for (i = 0; i <= alen; i++) {
        tmp[i] = [i];
    }

    for (j = 0; j <= blen; j++) {
        tmp[0][j] = j;
    }

    for (i = 1; i <= alen; i++) {
        for (j = 1; j <= blen; j++) {
            cost = (a[i - 1] === b[j - 1]) ? 0 : 1;
            tmp[i][j] = Math.min(
                tmp[i - 1][j] + 1,         // Deletion
                tmp[i][j - 1] + 1,         // Insertion
                tmp[i - 1][j - 1] + cost   // Substitution
            );
        }
    }

    return tmp[alen][blen];
}

import humanizeDuration, { HumanizerOptions } from "humanize-duration"

const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: "shortEn",
    languages: {
        shortEn: {
            y: () => "y",
            mo: () => "mo",
            w: () => "w",
            d: () => "d",
            h: () => "h",
            m: () => "m",
            s: () => "s",
            ms: () => "ms",
        },
    },
});

export function timeSince(date: number): string {
    if (!date) {
        return '';
    }
    const seconds = Math.floor((new Date().getTime() - date) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + " y ago";
    }

    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " mo ago";
    }

    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " d ago";
    }

    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " h ago";
    }

    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " m ago";
    }

    return Math.floor(seconds) + " s ago";
}

export function formatTime(date: Date): string {
    let hours: number | string = date.getHours();
    let minutes: number | string = date.getMinutes();

    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;

    return `${hours}:${minutes}`;
}

export function formatName(value: string): string {
    const name = value
        .replace(/\.[^.]+$/, "")
        .replace(/^\d+_/, "");

    const parts = name.split("_");

    return parts.length > 1
        ? parts.slice(0, -1).join("_")
        : name;
}

export function formatUsername(value: string): string {
    return value.replace(/_/g, ' ').trim();
}


export function formatDateWithTime(date: Date): string {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day}. ${month} ${year}`;
}

export function formatMinuteSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
  
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
  
    return `${minutes}:${formattedSeconds}`;
}

export function formatHoursMinute(secondsElapsed: number): string {

    const hours = Math.floor(secondsElapsed / 3600);
    const minutes = Math.floor((secondsElapsed % 3600) / 60);
    const seconds = secondsElapsed % 60;
  
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export const formatDuration = (duration: number) => {
    return shortEnglishHumanizer(duration, { largest: 1 });
}

export function formatCurrency(value: string): string {
    const currencyMap: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CNY': '¥',
        'INR': '₹',
        'RUB': '₽',
        'KRW': '₩',
        'BRL': 'R$',
        'CAD': 'C$',
        'AUD': 'A$',
        'CHF': 'CHF'
    };
    return currencyMap[value] || value || "";
}

const formatFunctions: { [key: string]: (value: any) => string } = {
    whole: (value: number) => Number(value).toFixed(0),
    decimal: (value: number) => Number(value).toFixed(2),
    uppercase: (value: string) => value.toUpperCase(),
    lowercase: (value: string) => value.toLowerCase(),
    duration: (value: string) => formatDuration(Number(value) * 1000),
    currency: (value: string) => formatCurrency(value),
    name: (value: string) => formatName(value),
    username: (value: string) => formatUsername(value),
};

// prüft einfache Bedingungen wie "durationMonths > 1"
function checkCondition(condition: string, args: Record<string, any>): boolean {
    const match = condition.match(/^(\w+)\s*(==|!=|>|<|>=|<=)\s*(\d+)$/);
    if (!match) return false;
    const [, key, op, numStr] = match;
    const val = Number(args[key]);
    const num = Number(numStr);

    switch (op) {
        case '==': return val === num;
        case '!=': return val !== num;
        case '>': return val > num;
        case '<': return val < num;
        case '>=': return val >= num;
        case '<=': return val <= num;
        default: return false;
    }
}

export function formatString(messageTemplate: string, args: Record<string, any>): string {
    if (!messageTemplate) {
        return '';
    }
    // Schritt 1: Condition-Blöcke auflösen
    messageTemplate = messageTemplate.replace(
        /\${\s*"([^"]+)"\s*,\s*"([^"]+)"\s*}/g,
        (_, template, condition) => {
            return checkCondition(condition, args)
                ? formatString(template, args) // inneres Template erneut verarbeiten
                : '';
        }
    );

    // Schritt 2: normale Platzhalter ersetzen
    return messageTemplate.replace(/\${([^:}]+)(?::(\w+))?}/g, (_, key, formatFunction) => {
        const value = args[key];
        if (formatFunction && formatFunctions[formatFunction]) {
            return formatFunctions[formatFunction](value);
        }
        return String(value ?? '');
    });
}

export function replacer(key: string, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}

export function reviver(key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

export function formatSeconds(seconds: number): string {
    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = roundedSeconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function useViewportWidthCallback(callback: (width: number) => void) {
    const { width } = useViewportSize();
  
    useEffect(() => {
      callback(width);
    }, [width, callback]);
}

const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const parseColor = (color: string): [number, number, number] => {
    const hex = color.startsWith('#');
    if (hex) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return [r, g, b];
    }
    const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return rgb as [number, number, number];
};

export const getContrastRatio = (color1: string, color2: string) => {
    const [r1, g1, b1] = parseColor(color1);
    const [r2, g2, b2] = parseColor(color2);

    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
};

export const adjustColorForContrast = (color: string, backgroundColor: string) => {
    let [r, g, b] = parseColor(color);
    let contrast = getContrastRatio(`rgb(${r},${g},${b})`, backgroundColor);
    const bgLuminance = getLuminance(...parseColor(backgroundColor));
    const darken = bgLuminance > 0.5;
    const step = 50; // Smaller step size for more gradual adjustments
    let iterations = 0;
    const maxIterations = 4; // Prevent infinite loops
    
    while (contrast < 4.5 && iterations < maxIterations) {
        if (darken) {
            // Darken the color
            r = Math.max(0, r - step);
            g = Math.max(0, g - step);
            b = Math.max(0, b - step);
        } else {
            // Lighten the color
            r = Math.min(255, r + step);
            g = Math.min(255, g + step);
            b = Math.min(255, b + step);
        }
        
        const newColor = `rgb(${r},${g},${b})`;
        contrast = getContrastRatio(newColor, backgroundColor);
        iterations++;
        
        // If we've reached the limits of RGB values and still haven't achieved desired contrast
        if ((darken && r === 0 && g === 0 && b === 0) || 
            (!darken && r === 255 && g === 255 && b === 255)) {
            break;
        }
    }
    
    return `rgb(${r},${g},${b})`;
};

export const joinWithSpace = (elements: React.ReactNode[]): React.ReactNode[] => {
    return elements.reduce<React.ReactNode[]>((acc, elem, index) => {
      if (index === 0) {
        return [elem];
      }
      return [...acc, ' ', elem];
    }, []);
};

/**
 * Deterministic sample function that selects an item from an array using a seed string
 * @param array The array to sample from
 * @param seed A string to use as a seed for deterministic selection
 * @returns A randomly selected item from the array, determined by the seed
 */
export function deterministicSample<T>(array: T[], seed: string): T {
  if (!array || array.length === 0) {
    throw new Error("Cannot sample from empty or undefined array");
  }
  
  // Generate a simple hash from the seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the absolute value of the hash to ensure positive number
  const positiveHash = Math.abs(hash);
  
  // Use the hash to select an index from the array
  const index = positiveHash % array.length;
  
  return array[index];
}
