/* eslint-disable no-restricted-globals */

// Connection states
enum ConnectionState {
    CONNECTING,
    CONNECTED,
    DISCONNECTED,
    RECONNECTING
}

// Configuration
const CONFIG = {
    INITIAL_RECONNECT_DELAY: 1000,
    MAX_RECONNECT_DELAY: 30000,
    RECONNECT_BACKOFF_FACTOR: 1.5,
    HEARTBEAT_TIMEOUT_MS: 25000,
    WATCHDOG_INTERVAL_MS: 5000
};

// State variables
let backendWebsocket: WebSocket | undefined;
let backEndIsReady: (value?: unknown) => void;
let backendReady = new Promise((resolve) => {
    backEndIsReady = resolve;
});
let initRequest: any | undefined;
let connectionState = ConnectionState.DISCONNECTED;
let reconnectAttempts = 0;
let reconnectTimeout: number | undefined;
let lastHeartbeatReceived = 0;
let lastEventTimestamp = 0;
let statusInterval: number | undefined;
let isClosing = false;

function stateName(state: ConnectionState): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    switch (state) {
        case ConnectionState.CONNECTING: return 'connecting';
        case ConnectionState.CONNECTED: return 'connected';
        case ConnectionState.DISCONNECTED: return 'disconnected';
        case ConnectionState.RECONNECTING: return 'reconnecting';
    }
}

function publishState() {
    self.postMessage({
        type: 'connectionStatus',
        data: {
            state: stateName(connectionState),
            reconnectAttempts,
            lastHeartbeat: lastHeartbeatReceived
        }
    });
}

function setState(next: ConnectionState) {
    if (connectionState === next) return;
    connectionState = next;
    publishState();
}

function clearWatchdog() {
    if (statusInterval !== undefined) {
        clearInterval(statusInterval);
        statusInterval = undefined;
    }
}

function startWatchdog() {
    clearWatchdog();
    statusInterval = setInterval(() => {
        if (connectionState !== ConnectionState.CONNECTED) return;
        if (lastHeartbeatReceived === 0) return;
        const elapsed = Date.now() - lastHeartbeatReceived;
        if (elapsed > CONFIG.HEARTBEAT_TIMEOUT_MS) {
            console.warn(`Heartbeat timeout (${elapsed}ms since last heartbeat) — forcing reconnect`);
            try {
                backendWebsocket?.close();
            } catch (e) {
                console.error('Error closing stale websocket:', e);
            }
        }
    }, CONFIG.WATCHDOG_INTERVAL_MS) as unknown as number;
}

/**
 * Resets the connection state and timers
 */
function resetConnectionState() {
    reconnectAttempts = 0;
    clearTimeout(reconnectTimeout as unknown as number);
    reconnectTimeout = undefined;
}

/**
 * Calculates the reconnect delay with exponential backoff
 */
function getReconnectDelay(): number {
    const delay = CONFIG.INITIAL_RECONNECT_DELAY * Math.pow(CONFIG.RECONNECT_BACKOFF_FACTOR, reconnectAttempts);
    return Math.min(delay, CONFIG.MAX_RECONNECT_DELAY);
}


/**
 * Establishes a connection to the backend server
 */
function connectToBackend() {
    if (connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.CONNECTED) {
        return;
    }

    setState(ConnectionState.CONNECTING);
    console.log(`Connecting to backend (attempt ${reconnectAttempts + 1})...`);

    try {
        backendWebsocket = new WebSocket(import.meta.env.VITE_BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://"));

        backendWebsocket.onopen = function () {
            setState(ConnectionState.CONNECTED);
            resetConnectionState();
            backEndIsReady();
            console.log("Websocket to backend opened");

            // Initialize the heartbeat timestamp before sending anything
            lastHeartbeatReceived = Date.now();
            startWatchdog();

            // Send the initial request if available, augmented with catchup hint
            if (initRequest) {
                const payload = lastEventTimestamp > 0
                    ? { ...initRequest, since: lastEventTimestamp }
                    : initRequest;
                backendWebsocket?.send(JSON.stringify(payload));
            }
        };

        backendWebsocket.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                // Handle heartbeat messages from the server
                if (data.type === "heartbeat") {
                    // Update the heartbeat timestamp
                    lastHeartbeatReceived = Date.now();

                    // Respond to heartbeat with a pong message
                    backendWebsocket?.send(JSON.stringify({
                        type: "pong",
                        timestamp: Date.now(),
                        originalTimestamp: data.timestamp
                    }));
                    return;
                }

                // Any received data implies the connection is alive
                lastHeartbeatReceived = Date.now();

                // Track the latest event timestamp for catchup on reconnect
                const ts = data?.data?.timestamp ?? data?.timestamp;
                if (typeof ts === 'number' && ts > lastEventTimestamp) {
                    lastEventTimestamp = ts;
                }

                // Forward all other messages to the main thread
                self.postMessage(data);
            } catch (error) {
                console.error("Error processing message:", error);
            }
        };

        backendWebsocket.onclose = function (e) {
            clearWatchdog();
            setState(ConnectionState.DISCONNECTED);
            console.log(`Socket is closed. Reconnect will be attempted in ${getReconnectDelay()}ms.`, e.reason);

            // Don't reconnect if we're closing
            if (isClosing) {
                return;
            }

            // Schedule reconnection with exponential backoff
            reconnectAttempts++;
            reconnectTimeout = setTimeout(() => {
                if (!isClosing) {
                    connectToBackend();
                }
            }, getReconnectDelay()) as unknown as number;
        };

        backendWebsocket.onerror = function (err: Event) {
            console.error('Socket encountered error:', err);
            // Set state to reconnecting since we'll try to reconnect
            setState(ConnectionState.RECONNECTING);

            // The onclose handler will be called after this
        };
    } catch (error) {
        setState(ConnectionState.DISCONNECTED);
        console.error("Error creating WebSocket:", error);

        // Schedule reconnection
        reconnectAttempts++;
        reconnectTimeout = setTimeout(() => {
            connectToBackend();
        }, getReconnectDelay()) as unknown as number;
    }
}

// Initial connection
connectToBackend();

/**
 * Handle messages from the main thread
 */
self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'SEND':
            await backendReady;
            if ((data.type === "subscribe" && data.source === "HeheChat App") ||
                (data.type === "sink" && data.source === "Replay App") ||
                (data.type === "sink" && data.source === "Browsersource")) {
                initRequest = data;
            }

            try {
                if (backendWebsocket?.readyState === WebSocket.OPEN) {
                    backendWebsocket.send(JSON.stringify(data));
                } else {
                    console.warn("Cannot send message: WebSocket is not open");
                    // Queue message to be sent when connection is re-established
                    // (init requests are already handled by the connection logic)
                    if (!((data.type === "subscribe" && data.source === "HeheChat App") ||
                        (data.type === "sink" && data.source === "Replay App") ||
                        (data.type === "sink" && data.source === "Browsersource"))) {
                        console.log("Message will be lost as it's not an init request");
                    }
                }
            } catch (error) {
                console.error("Error sending message:", error);
            }
            break;

        case 'RECONNECT':
            // Force reconnection — reset backoff so the next attempt is immediate
            console.log("Forcing reconnection to backend");
            reconnectAttempts = 0;
            clearTimeout(reconnectTimeout as unknown as number);
            reconnectTimeout = undefined;

            if (backendWebsocket && backendWebsocket.readyState !== WebSocket.CLOSED) {
                setState(ConnectionState.RECONNECTING);
                try {
                    backendWebsocket.close();
                } catch (err) {
                    console.error('Error closing websocket for reconnect:', err);
                }
            } else {
                // No live socket — connect directly
                connectToBackend();
            }
            break;

        case 'STATUS':
            // Allow the main thread to ask for a fresh status broadcast
            publishState();
            break;

        case 'STOP':
            // Set closing flag to prevent reconnections
            isClosing = true;

            // Clean up before closing
            resetConnectionState();
            clearWatchdog();

            if (backendWebsocket) {
                backendWebsocket.close();
            }
            close();
            break;

        default:
            console.warn(`Unknown message type: ${type}`);
            break;
    }
};
