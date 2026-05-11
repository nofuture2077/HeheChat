const BASE_URL = import.meta.env.VITE_BACKEND_URL;

function token() {
    return localStorage.getItem('hehe-token_state') || '';
}

export interface SwitcherStatus {
    scene: string;
    bitrate_kbps: number | null;
    rtt_ms: number | null;
}

export interface SwitcherScenes {
    scenes: string[];
}

export type ProviderType =
    | 'nginx-rtmp' | 'nms' | 'nimble' | 'sls' | 'belabox'
    | 'mediamtx' | 'rist' | 'xiu' | 'irl-hosting' | 'openirl';

export interface SwitcherConfig {
    provider_type: ProviderType;
    stats_url: string;
    poll_interval_ms: number;
    provider_config: Record<string, string>;
    enabled: boolean;
    stop_stream_after_raid?: boolean;
    stop_stream_after_raid_delay_ms?: number;
    stream_start_message?: string | null;
    stream_stop_message?: string | null;
    yellow_threshold_kbps?: number;
    red_threshold_kbps?: number;
}

export interface SwitcherRule {
    id: string;
    priority: number;
    condition: {
        metric: 'bitrate_kbps' | 'rtt_ms';
        operator: '<' | '>' | '<=' | '>=';
        value: number;
        duration_ms: number;
    };
    target_scene: string;
    cooldown_ms: number;
    enabled: boolean;
    scene_group?: string | null;
    chat_message?: string | null;
}

export type SwitcherRuleInput = Omit<SwitcherRule, 'id'>;

// --- Scene endpoints ---

export async function getSwitcherStatus(channel: string): Promise<SwitcherStatus> {
    return fetch(`${BASE_URL}/api/switcher/status/${channel}?token=${token()}`).then(r => r.json());
}

export async function getSwitcherScenes(channel: string): Promise<SwitcherScenes> {
    return fetch(`${BASE_URL}/api/switcher/scenes/${channel}?token=${token()}`).then(r => r.json());
}

export async function postSwitcherScene(channel: string, scene: string): Promise<void> {
    await fetch(`${BASE_URL}/api/switcher/scene/${channel}?token=${token()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene }),
    });
}

// --- Provider config ---

export async function getSwitcherConfig(channel: string): Promise<SwitcherConfig> {
    return fetch(`${BASE_URL}/api/switcher/config/${channel}?token=${token()}`).then(r => r.json());
}

export async function putSwitcherConfig(channel: string, config: SwitcherConfig): Promise<void> {
    await fetch(`${BASE_URL}/api/switcher/config/${channel}?token=${token()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
}

// --- Rules ---

export async function getSwitcherRules(channel: string): Promise<SwitcherRule[]> {
    return fetch(`${BASE_URL}/api/switcher/rules/${channel}?token=${token()}`).then(r => r.json());
}

export async function postSwitcherRule(channel: string, rule: SwitcherRuleInput): Promise<SwitcherRule> {
    return fetch(`${BASE_URL}/api/switcher/rules/${channel}?token=${token()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
    }).then(r => r.json());
}

export async function putSwitcherRule(channel: string, id: string, rule: Partial<SwitcherRuleInput>): Promise<void> {
    await fetch(`${BASE_URL}/api/switcher/rules/${channel}/${id}?token=${token()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
    });
}

export async function deleteSwitcherRule(channel: string, id: string): Promise<void> {
    await fetch(`${BASE_URL}/api/switcher/rules/${channel}/${id}?token=${token()}`, {
        method: 'DELETE',
    });
}

// --- Stream start/stop ---

export interface OBSStreamStatus {
    outputActive: boolean;
}

export async function getStreamStatus(channel: string): Promise<OBSStreamStatus> {
    return fetch(`${BASE_URL}/api/switcher/stream/status/${channel}?token=${token()}`).then(r => r.json());
}

export async function postStreamStart(channel: string): Promise<void> {
    await fetch(`${BASE_URL}/api/switcher/stream/start/${channel}?token=${token()}`, { method: 'POST' });
}

export async function postStreamStop(channel: string): Promise<void> {
    await fetch(`${BASE_URL}/api/switcher/stream/stop/${channel}?token=${token()}`, { method: 'POST' });
}

// --- OBS client token ---

export async function getSwitcherClientToken(channel: string): Promise<{ token: string }> {
    return fetch(`${BASE_URL}/api/switcher/client/${channel}?token=${token()}`).then(r => r.json());
}
