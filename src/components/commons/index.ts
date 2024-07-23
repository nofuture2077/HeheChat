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

export function toMap<A, K>(arr: A[], func1: (el: A) => K) {
    return arr.reduce((acc, el) => {
        acc.set(func1(el), el);
        return acc;
    }, new Map());
}

export function generateGUID(): string {
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000000);
    return `${timestamp}-${randomNum}`;
}