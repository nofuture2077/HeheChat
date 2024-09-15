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

export const formatDuration = (duration: number) => {
    return shortEnglishHumanizer(duration, { largest: 1 });
}


export function formatString(template: string, args: any[]): string {
    return template.replace(/\$(\d+)/g, (_, index) => args[index] || '');
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