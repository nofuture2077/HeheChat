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

const obs = new OBSWebSocket();
let heheWs: WebSocket | null = null;
let obsConnected = false;
let heheConnected = false;

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
        sendToHehe({ type: 'streamStatus', outputActive, outputReconnecting });
    } catch {
        // OBS not ready yet
    }
}

// ── HeheServer connection ─────────────────────────────────────────────────────

function connectHehe() {
    heheWs = new WebSocket(heheWsUrl!);

    heheWs.addEventListener('open', () => {
        heheConnected = true;
        updateStatus();
        heheWs!.send(JSON.stringify({ type: 'obs-client', token }));
    });

    heheWs.addEventListener('message', async (event) => {
        let msg: { type: string; channel?: string; scene?: string; message?: string };
        try { msg = JSON.parse(event.data); } catch { return; }

        if (msg.type === 'obs-client-ready') {
            if (obsConnected) await sendSceneList();
            return;
        }

        if (msg.type === 'setScene') {
            if (!obsConnected || !msg.scene) return;
            try {
                await obs.call('SetCurrentProgramScene', { sceneName: msg.scene });
            } catch {
                // scene may not exist
            }
            return;
        }

        if (msg.type === 'startStream') {
            if (!obsConnected) return;
            try { await obs.call('StartStream'); } catch { }
            return;
        }

        if (msg.type === 'stopStream') {
            if (!obsConnected) return;
            try { await obs.call('StopStream'); } catch { }
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

// ── Startup ───────────────────────────────────────────────────────────────────

connectObs();
connectHehe();
