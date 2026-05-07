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

const obs = new OBSWebSocket();
let heheWs: WebSocket | null = null;
let obsConnected = false;
let heheConnected = false;

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

// ── OBS connection ────────────────────────────────────────────────────────────

async function connectObs() {
    try {
        await obs.connect(obsWsUrl, obsPassword);
        obsConnected = true;
        updateStatus();
        if (heheConnected) await sendSceneList();
    } catch (err) {
        obsConnected = false;
        updateStatus();
        setTimeout(connectObs, 5000);
    }
}

obs.on('ConnectionClosed', () => {
    obsConnected = false;
    updateStatus();
    setTimeout(connectObs, 5000);
});

obs.on('CurrentProgramSceneChanged', ({ sceneName }) => {
    sendToHehe({ type: 'sceneReport', scene: sceneName });
});

obs.on('SceneListChanged', ({ scenes }) => {
    sendToHehe({ type: 'sceneList', scenes: (scenes as { sceneName: string }[]).map(s => s.sceneName) });
});

obs.on('StreamStateChanged', ({ outputActive, outputReconnecting }) => {
    sendToHehe({ type: 'streamStatus', outputActive, outputReconnecting });
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
        setTimeout(connectHehe, 5000);
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

// ── Startup ───────────────────────────────────────────────────────────────────

connectObs();
connectHehe();
