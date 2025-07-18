import { Profile } from '@/commons/profile';

const STORAGE_KEYS = {
    PROFILES: 'dev_profiles',
    ACTIVE_PROFILE: 'dev_active_profile',
    SHARES: 'dev_shares',
    RECEIVED_SHARES: 'dev_received_shares'
} as const;

export function getProfiles(): Profile[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
}

export function setProfiles(profiles: Profile[]): void {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

export function getActiveProfile(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
}

export function setActiveProfile(guid: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, guid);
}

export function getShares(): string[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHARES) || '[]');
}

export function setShares(shares: string[]): void {
    localStorage.setItem(STORAGE_KEYS.SHARES, JSON.stringify(shares));
}

export function getReceivedShares(): string[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIVED_SHARES) || '[]');
}

export function setReceivedShares(shares: string[]): void {
    localStorage.setItem(STORAGE_KEYS.RECEIVED_SHARES, JSON.stringify(shares));
}
