const BASE_URL = import.meta.env.VITE_BACKEND_URL;

function token() {
    return localStorage.getItem('hehe-token_state') || '';
}

export interface SpotifyCurrentlyPlaying {
    name: string;
    artist: string;
    isPlaying: boolean;
    volumePercent: number;
}

export interface SpotifyStatus {
    connected: boolean;
    currentlyPlaying: SpotifyCurrentlyPlaying | null;
}

export interface SpotifySettings {
    chatCommandEnabled: boolean;
    channelPointsEnabled: boolean;
    channelPointsRewardTitle: string;
    playlistUri: string | null;
    playlistName: string | null;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    image: string | null;
    uri: string;
}

export type SpotifyQueueStatus = 'pending' | 'approved' | 'rejected' | 'played';
export type SpotifyQueueSource = 'chat' | 'channelPoints';

export interface SpotifyQueueItem {
    id: string;
    requesterUsername: string;
    query: string;
    trackName: string | null;
    artistName: string | null;
    status: SpotifyQueueStatus;
    source: SpotifyQueueSource;
    createdAt: string;
}

export async function getSpotifyAuthUrl(state: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/spotify/auth-url?state=${encodeURIComponent(state)}`);
    const data = await res.json();
    return data.url as string;
}

export async function getSpotifyStatus(state: string): Promise<SpotifyStatus> {
    const res = await fetch(`${BASE_URL}/spotify/status?state=${encodeURIComponent(state)}`);
    return res.json();
}

export async function playSpotify(state: string, context_uri?: string): Promise<void> {
    await fetch(`${BASE_URL}/spotify/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, context_uri }),
    });
}

export async function pauseSpotify(state: string): Promise<void> {
    await fetch(`${BASE_URL}/spotify/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
    });
}

export async function skipSpotify(state: string): Promise<void> {
    await fetch(`${BASE_URL}/spotify/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
    });
}

export async function setSpotifyVolume(state: string, value: number): Promise<void> {
    await fetch(`${BASE_URL}/spotify/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, value }),
    });
}

export async function getSpotifySettings(state: string): Promise<SpotifySettings> {
    const res = await fetch(`${BASE_URL}/spotify/settings?state=${encodeURIComponent(state)}`);
    return res.json();
}

export async function updateSpotifySettings(
    state: string,
    settings: Partial<SpotifySettings>
): Promise<SpotifySettings> {
    const res = await fetch(`${BASE_URL}/spotify/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, ...settings }),
    });
    return res.json();
}

export async function getSpotifyPlaylists(state: string): Promise<SpotifyPlaylist[]> {
    const res = await fetch(`${BASE_URL}/spotify/playlists?state=${encodeURIComponent(state)}`);
    return res.json();
}

export async function getSpotifyQueue(state: string): Promise<SpotifyQueueItem[]> {
    const res = await fetch(`${BASE_URL}/spotify/queue?state=${encodeURIComponent(state)}`);
    return res.json();
}

export async function submitSpotifyQueue(
    state: string,
    query: string,
    requester: string,
    source: SpotifyQueueSource
): Promise<SpotifyQueueItem | null> {
    const res = await fetch(`${BASE_URL}/spotify/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, query, requester, source }),
    });
    if (res.status === 403) return null;
    return res.json();
}

export async function approveSpotifyQueue(id: string, state: string): Promise<void> {
    await fetch(`${BASE_URL}/spotify/queue/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
    });
}

export async function deleteSpotifyQueue(id: string, state: string): Promise<void> {
    await fetch(`${BASE_URL}/spotify/queue/${id}?state=${encodeURIComponent(state)}`, {
        method: 'DELETE',
    });
}

export function spotifyToken() {
    return token();
}
