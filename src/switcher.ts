import { version } from '../package.json';
import OBSWebSocket from 'obs-websocket-js';

const params = new URLSearchParams(location.search);
const heheWsUrl = params.get('heheWsUrl');
const obsWsUrl = params.get('obsWsUrl') || 'ws://localhost:4455';
const obsPassword = params.get('obsPassword') || '';
const token = params.get('token');

const statusEl = document.getElementById('status')!;

function setStatus(text: string) {
    statusEl.textContent = text;
}

if (!heheWsUrl || !token) {
    setStatus('Missing heheWsUrl or token params');
    throw new Error('Missing heheWsUrl or token params');
}

const INITIAL_DELAY = 1000;
const MAX_DELAY = 30000;
const BACKOFF = 1.5;

function calcDelay(attempts: number) {
    return Math.min(INITIAL_DELAY * Math.pow(BACKOFF, attempts), MAX_DELAY);
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const obs = new OBSWebSocket();
let heheWs: WebSocket | null = null;
let obsConnected = false;
let heheConnected = false;
let streamActive = false;
let streamStatusKnown = false;

function updateStreamStatus(outputActive: boolean | undefined) {
    if (typeof outputActive !== 'boolean') return;
    streamActive = outputActive;
    streamStatusKnown = true;
}

let obsReconnectTimer: ReturnType<typeof setTimeout> | undefined;
let heheReconnectTimer: ReturnType<typeof setTimeout> | undefined;
let obsAttempts = 0;
let heheAttempts = 0;

function updateStatus() {
    if (obsConnected && heheConnected) {
        setStatus('✓ OBS + HeheServer connected');
    } else if (obsConnected) {
        setStatus('OBS connected · HeheServer disconnected');
    } else if (heheConnected) {
        setStatus('OBS disconnected · HeheServer connected');
    } else {
        setStatus('Connecting…');
    }
}

function scheduleObsReconnect() {
    if (obsReconnectTimer !== undefined) return;
    const delay = calcDelay(obsAttempts);
    obsAttempts++;
    obsReconnectTimer = setTimeout(() => {
        obsReconnectTimer = undefined;
        connectObs();
    }, delay);
}

function scheduleHeheReconnect() {
    if (heheReconnectTimer !== undefined) return;
    const delay = calcDelay(heheAttempts);
    heheAttempts++;
    heheReconnectTimer = setTimeout(() => {
        heheReconnectTimer = undefined;
        connectHehe();
    }, delay);
}

// ── OBS connection ────────────────────────────────────────────────────────────

async function connectObs() {
    try {
        await obs.connect(obsWsUrl, obsPassword);
        obsConnected = true;
        obsAttempts = 0;
        updateStatus();
        if (heheConnected) await sendSceneList();
    } catch (err) {
        obsConnected = false;
        updateStatus();
        scheduleObsReconnect();
    }
}

obs.on('ConnectionClosed', () => {
    obsConnected = false;
    streamStatusKnown = false;
    updateStatus();
    scheduleObsReconnect();
});

obs.on('CurrentProgramSceneChanged', ({ sceneName }) => {
    sendToHehe({ type: 'sceneReport', scene: sceneName });
});

obs.on('SceneListChanged', ({ scenes }) => {
    sendToHehe({ type: 'sceneList', scenes: (scenes as { sceneName: string }[]).map(s => s.sceneName) });
});

obs.on('StreamStateChanged', ({ outputActive, outputState }) => {
    updateStreamStatus(outputActive);
    sendToHehe({ type: 'streamStatus', outputActive, outputState });
});

async function sendSceneList() {
    try {
        const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
        sendToHehe({ type: 'sceneList', scenes: (scenes as { sceneName: string }[]).map(s => s.sceneName) });
        sendToHehe({ type: 'sceneReport', scene: currentProgramSceneName });
    } catch {
        // OBS not ready yet
    }
    try {
        const { outputActive, outputReconnecting } = await obs.call('GetStreamStatus');
        updateStreamStatus(outputActive);
        sendToHehe({ type: 'streamStatus', outputActive, outputReconnecting });
    } catch {
        // OBS not ready yet
    }
}

// ── Action verification ───────────────────────────────────────────────────────

// Poll OBS until the stream reaches the desired state. StartStream/StopStream
// are asynchronous in OBS, so the call returning does not mean the state changed.
async function verifyStreamState(desiredActive: boolean, timeoutMs = 6000): Promise<{ ok: boolean; outputActive: boolean }> {
    const deadline = Date.now() + timeoutMs;
    let outputActive = !desiredActive;
    while (Date.now() <= deadline) {
        try {
            ({ outputActive } = await obs.call('GetStreamStatus'));
            updateStreamStatus(outputActive);
            if (outputActive === desiredActive) return { ok: true, outputActive };
        } catch {
            // OBS may be mid-transition — keep polling
        }
        await delay(400);
    }
    return { ok: false, outputActive };
}

async function handleStreamCommand(id: string | undefined, command: 'startStream' | 'stopStream') {
    const desiredActive = command === 'startStream';
    if (!obsConnected) {
        sendToHehe({ type: 'commandAck', id, command, success: false, reason: 'obs-disconnected' });
        return;
    }
    try {
        await obs.call(desiredActive ? 'StartStream' : 'StopStream');
    } catch {
        // May throw if already in the desired state or mid-transition —
        // verification below decides whether the action actually took effect.
    }
    const { ok, outputActive } = await verifyStreamState(desiredActive);
    sendToHehe({ type: 'commandAck', id, command, success: ok, outputActive });
}

async function handleSetScene(id: string | undefined, scene: string | undefined) {
    if (!obsConnected || !scene) {
        sendToHehe({ type: 'commandAck', id, command: 'setScene', success: false, scene, reason: 'obs-disconnected' });
        return;
    }
    let success = false;
    let current = scene;
    try {
        await obs.call('SetCurrentProgramScene', { sceneName: scene });
        const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
        current = currentProgramSceneName;
        success = currentProgramSceneName === scene;
    } catch {
        success = false; // scene may not exist
    }
    sendToHehe({ type: 'commandAck', id, command: 'setScene', success, scene: current });
}

// ── HeheServer connection ─────────────────────────────────────────────────────

function connectHehe() {
    heheWs = new WebSocket(heheWsUrl!);

    heheWs.addEventListener('open', () => {
        heheConnected = true;
        updateStatus();
        heheWs!.send(JSON.stringify({ type: 'obs-client', token, version }));
    });

    heheWs.addEventListener('message', async (event) => {
        let msg: { type: string; id?: string; channel?: string; scene?: string; message?: string };
        try { msg = JSON.parse(event.data); } catch { return; }

        if (msg.type === 'obs-client-ready') {
            if (obsConnected) await sendSceneList();
            return;
        }

        if (msg.type === 'setScene') {
            await handleSetScene(msg.id, msg.scene);
            return;
        }

        if (msg.type === 'startStream') {
            await handleStreamCommand(msg.id, 'startStream');
            return;
        }

        if (msg.type === 'stopStream') {
            await handleStreamCommand(msg.id, 'stopStream');
            return;
        }
    });

    heheWs.addEventListener('close', () => {
        heheConnected = false;
        updateStatus();
        scheduleHeheReconnect();
    });

    heheWs.addEventListener('error', () => {
        // close event will fire and trigger reconnect
    });
}

function sendToHehe(data: object) {
    if (heheWs && heheConnected && heheWs.readyState === WebSocket.OPEN) {
        heheWs.send(JSON.stringify(data));
    }
}

// ── Reconnect on visibility / network restore ─────────────────────────────────

let reconnectDebounce: ReturnType<typeof setTimeout> | undefined;

function forceReconnect() {
    clearTimeout(reconnectDebounce);
    reconnectDebounce = setTimeout(() => {
        if (!obsConnected) {
            clearTimeout(obsReconnectTimer);
            obsReconnectTimer = undefined;
            connectObs();
        }
        if (!heheConnected) {
            clearTimeout(heheReconnectTimer);
            heheReconnectTimer = undefined;
            connectHehe();
        }
    }, 1000);
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') forceReconnect();
});

window.addEventListener('online', forceReconnect);

// ── Version check ─────────────────────────────────────────────────────────────
// Reload to a new build, but only while OBS is confirmed not streaming, so a
// long-running browser source eventually drifts to latest without disrupting a
// live broadcast.

const VERSION_CHECK_INTERVAL = 30 * 60 * 1000;
const IDLE_POLL_INTERVAL = 5000;
const STORAGE_KEY_LAST_CHECK = 'hehe-version-last-check';
const STORAGE_KEY_CURRENT_VERSION = 'hehe-current-version';

let pendingReload = false;

async function getCurrentVersion(): Promise<string> {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_VERSION);
    if (stored) return stored;
    try {
        const resp = await fetch('/manifest.json');
        if (resp.ok) {
            const m = await resp.json();
            const v: string = m.version || '0.0.1';
            localStorage.setItem(STORAGE_KEY_CURRENT_VERSION, v);
            return v;
        }
    } catch {
        // fall through
    }
    return '0.0.1';
}

async function checkRemoteVersion() {
    const sinkUrl = import.meta.env.VITE_SINK_URL;
    if (!sinkUrl) return;
    try {
        const current = await getCurrentVersion();
        const resp = await fetch(`${sinkUrl}/manifest.json?t=${Date.now()}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
            },
        });
        if (!resp.ok) return;
        const m = await resp.json();
        const latest: string | undefined = m.version;
        if (!latest) return;
        localStorage.setItem(STORAGE_KEY_LAST_CHECK, Date.now().toString());
        if (current.replace(/^v/, '') !== latest.replace(/^v/, '')) {
            localStorage.setItem(STORAGE_KEY_CURRENT_VERSION, latest);
            pendingReload = true;
        }
    } catch (err) {
        console.warn('Version check failed:', err);
    }
}

function shouldCheckNow(): boolean {
    const last = localStorage.getItem(STORAGE_KEY_LAST_CHECK);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) >= VERSION_CHECK_INTERVAL;
}

if (shouldCheckNow()) checkRemoteVersion();
setInterval(() => { if (shouldCheckNow()) checkRemoteVersion(); }, VERSION_CHECK_INTERVAL);
setInterval(() => {
    if (pendingReload && streamStatusKnown && !streamActive) {
        location.reload();
    }
}, IDLE_POLL_INTERVAL);

// ── Startup ───────────────────────────────────────────────────────────────────

connectObs();
connectHehe();
