import { createContext } from 'react';
import PubSub from 'pubsub-js';
import { parseMessage } from './message';
import {
    SpotifyCurrentlyPlaying,
    SpotifySettings,
    SpotifyQueueItem,
    SpotifyQueueSource,
    getSpotifyStatus,
    playSpotify,
    pauseSpotify,
    skipSpotify,
    setSpotifyVolume,
    getSpotifySettings,
    updateSpotifySettings,
    getSpotifyQueue,
    submitSpotifyQueue,
    approveSpotifyQueue,
    deleteSpotifyQueue,
    spotifyToken,
} from '@/api/spotify';

const POLL_INTERVAL_MS = 7000;

function token() {
    return spotifyToken();
}

export interface MusicData {
    connected: boolean;
    currentTrack: SpotifyCurrentlyPlaying | null;
    queue: SpotifyQueueItem[];
    settings: SpotifySettings;
}

export interface Music extends MusicData {
    refreshStatus: () => Promise<void>;
    refreshQueue: () => Promise<void>;
    play: (context_uri?: string) => Promise<void>;
    pause: () => Promise<void>;
    skip: () => Promise<void>;
    setVolume: (value: number) => Promise<void>;
    duck: () => Promise<void>;
    restoreVolume: () => Promise<void>;
    updateSettings: (partial: Partial<SpotifySettings>) => Promise<void>;
    submitSongRequest: (
        query: string,
        requester: string,
        source: SpotifyQueueSource
    ) => Promise<boolean>;
    approve: (id: string) => Promise<void>;
    reject: (id: string) => Promise<void>;
}

export const DEFAULT_SPOTIFY_SETTINGS: SpotifySettings = {
    chatCommandEnabled: false,
    channelPointsEnabled: false,
    channelPointsRewardTitle: '',
    playlistUri: null,
    playlistName: null,
};

export const DEFAULT_MUSIC: Music = {
    connected: false,
    currentTrack: null,
    queue: [],
    settings: DEFAULT_SPOTIFY_SETTINGS,
    refreshStatus: async () => {},
    refreshQueue: async () => {},
    play: async () => {},
    pause: async () => {},
    skip: async () => {},
    setVolume: async () => {},
    duck: async () => {},
    restoreVolume: async () => {},
    updateSettings: async () => {},
    submitSongRequest: async () => false,
    approve: async () => {},
    reject: async () => {},
};

export const MusicContext = createContext<Music>(DEFAULT_MUSIC);

/**
 * Singleton class that owns Spotify integration state: polling for status/queue,
 * ducking volume during alerts, and parsing !songrequest chat commands.
 * Mirrors the pattern used elsewhere (e.g. AlertSystem) of a long-lived class
 * driving React context via a state setter, instantiated once for the app's lifetime.
 */
export class MusicController {
    connected = false;
    currentTrack: SpotifyCurrentlyPlaying | null = null;
    queue: SpotifyQueueItem[] = [];
    settings: SpotifySettings = DEFAULT_SPOTIFY_SETTINGS;

    private preDuckVolume: number | null = null;
    private pollHandle: ReturnType<typeof setInterval> | null = null;
    private alertPlayerWasPlaying = false;
    private onChange: (() => void) | null = null;
    private alertSub: string | null = null;

    private chatSub: string | null = null;

    constructor() {
        this.alertSub = PubSub.subscribe('AlertPlayer-update', () => {
            this.handleAlertPlayerUpdate();
        });
        // Chat commands (!songrequest) arrive over the WS-msg PubSub topic used for
        // incoming Twitch chat messages (see Chat.page.tsx's "WS-msg" subscription).
        // config.onMessage/fireMessage is only for messages the local user sends via
        // ChatInput, so it can't be used to observe viewer chat commands.
        this.chatSub = PubSub.subscribe('WS-msg', (_msg: string, data: any) => {
            this.handleIncomingChatMessage(data);
        });
    }

    private handleIncomingChatMessage(data: any) {
        if (!data?.message) return;
        try {
            const message = parseMessage(data.message);
            if (message.type !== 'chat') return;
            const text: string = (message as any).text || '';
            const prefix = '!songrequest ';
            if (!text.toLowerCase().startsWith(prefix)) return;
            if (!this.settings.chatCommandEnabled) return;
            const query = text.slice(prefix.length).trim();
            if (!query) return;
            const requester = data.username || (message as any).userInfo?.userName || 'unknown';
            this.submitSongRequest(query, requester, 'chat');
        } catch {
            // ignore malformed messages
        }
    }

    setChangeListener(cb: (() => void) | null) {
        this.onChange = cb;
    }

    private notify() {
        this.onChange?.();
    }

    private handleAlertPlayerUpdate() {
        // AlertPlayer-update doesn't reliably carry a `playing` flag on every publish,
        // so we poll the global AlertSystem status instead of trusting event payloads.
        import('@/components/alerts/alertplayer').then(({ AlertSystem }) => {
            const isPlaying = !!AlertSystem.status();
            if (isPlaying && !this.alertPlayerWasPlaying) {
                this.alertPlayerWasPlaying = true;
                this.duck();
            } else if (!isPlaying && this.alertPlayerWasPlaying) {
                this.alertPlayerWasPlaying = false;
                this.restoreVolume();
            }
        }).catch(() => {});
    }

    async refreshStatus() {
        try {
            const status = await getSpotifyStatus(token());
            this.connected = status.connected;
            this.currentTrack = status.currentlyPlaying;
            this.notify();
            if (this.connected) {
                this.startPolling();
                if (!this.settings.chatCommandEnabled && !this.settings.channelPointsEnabled) {
                    this.refreshSettings();
                }
            } else {
                this.stopPolling();
            }
        } catch {
            // Ignore transient errors, next poll will retry.
        }
    }

    async refreshSettings() {
        try {
            this.settings = await getSpotifySettings(token());
            this.notify();
        } catch {
            // ignore
        }
    }

    async refreshQueue() {
        if (!this.connected) return;
        try {
            this.queue = await getSpotifyQueue(token());
            this.notify();
        } catch {
            // ignore
        }
    }

    startPolling() {
        if (this.pollHandle) return;
        this.pollHandle = setInterval(() => {
            this.refreshStatus();
            this.refreshQueue();
        }, POLL_INTERVAL_MS);
    }

    stopPolling() {
        if (this.pollHandle) {
            clearInterval(this.pollHandle);
            this.pollHandle = null;
        }
    }

    async play(context_uri?: string) {
        await playSpotify(token(), context_uri);
        await this.refreshStatus();
    }

    async pause() {
        await pauseSpotify(token());
        await this.refreshStatus();
    }

    async skip() {
        await skipSpotify(token());
        await this.refreshStatus();
    }

    async setVolume(value: number) {
        await setSpotifyVolume(token(), value);
        if (this.currentTrack) {
            this.currentTrack = { ...this.currentTrack, volumePercent: value };
            this.notify();
        }
    }

    async duck() {
        const current = this.currentTrack?.volumePercent;
        if (current === undefined || current === null) return;
        if (this.preDuckVolume === null) {
            this.preDuckVolume = current;
        }
        const duckedVolume = Math.round(this.preDuckVolume * 0.25);
        await this.setVolume(duckedVolume);
    }

    async restoreVolume() {
        if (this.preDuckVolume === null) return;
        const restoreTo = this.preDuckVolume;
        this.preDuckVolume = null;
        await this.setVolume(restoreTo);
    }

    async updateSettings(partial: Partial<SpotifySettings>) {
        this.settings = await updateSpotifySettings(token(), partial);
        this.notify();
    }

    async submitSongRequest(
        query: string,
        requester: string,
        source: SpotifyQueueSource
    ): Promise<boolean> {
        if (source === 'chat' && !this.settings.chatCommandEnabled) return false;
        if (source === 'channelPoints' && !this.settings.channelPointsEnabled) return false;
        const result = await submitSpotifyQueue(token(), query, requester, source);
        if (result) {
            await this.refreshQueue();
            return true;
        }
        return false;
    }

    async approve(id: string) {
        await approveSpotifyQueue(id, token());
        await this.refreshQueue();
    }

    async reject(id: string) {
        await deleteSpotifyQueue(id, token());
        await this.refreshQueue();
    }
}

// Long-lived singleton, mirrors AlertSystem in alertplayer.tsx: instantiated once for
// the app's lifetime, so its PubSub subscriptions are never torn down.
export const musicController = new MusicController();
