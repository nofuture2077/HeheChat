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
    RECONNECT_BACKOFF_FACTOR: 1.5
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
let statusInterval: number | undefined;
let isClosing = false;

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
    
    connectionState = ConnectionState.CONNECTING;
    console.log(`Connecting to backend (attempt ${reconnectAttempts + 1})...`);
    
    // Report status immediately when connecting
    reportStatus();
    
    try {
        backendWebsocket = new WebSocket(import.meta.env.VITE_BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://"));
        
        backendWebsocket.onopen = function () {
            connectionState = ConnectionState.CONNECTED;
            resetConnectionState();
            backEndIsReady();
            console.log("Websocket to backend opened");
            
            // Send the initial request if available
            if (initRequest) {
                backendWebsocket?.send(JSON.stringify(initRequest));
            }
            
            // Initialize the heartbeat timestamp
            lastHeartbeatReceived = Date.now();
            
            // Report status immediately when connected
            reportStatus();
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
                
                // Forward all other messages to the main thread
                self.postMessage(data);
            } catch (error) {
                console.error("Error processing message:", error);
            }
        };

        backendWebsocket.onclose = function (e) {
            connectionState = ConnectionState.DISCONNECTED;
            console.log(`Socket is closed. Reconnect will be attempted in ${getReconnectDelay()}ms.`, e.reason);
            
            // Report status immediately when disconnected
            reportStatus();
            
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
            connectionState = ConnectionState.RECONNECTING;
            
            // Report status immediately when there's an error
            reportStatus();
            
            // The onclose handler will be called after this
        };
    } catch (error) {
        connectionState = ConnectionState.DISCONNECTED;
        console.error("Error creating WebSocket:", error);
        
        // Report status immediately when there's an error
        reportStatus();
        
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
            // Force reconnection
            console.log("Forcing reconnection to backend");
            connectionState = ConnectionState.RECONNECTING;
            
            // Report status immediately when reconnecting
            reportStatus();
            
            if (backendWebsocket) {
                backendWebsocket.close();
            }
            break;
            
        case 'STOP':
            // Set closing flag to prevent reconnections
            isClosing = true;
            
            // Clean up before closing
            resetConnectionState();
            
            // Clear status interval
            if (statusInterval) {
                clearInterval(statusInterval);
                statusInterval = undefined;
            }
            
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

/**
 * Report connection status to main thread
 */
function reportStatus() {
    self.postMessage({
        type: "connectionStatus",
        status: connectionState,
        reconnectAttempts,
        lastHeartbeat: lastHeartbeatReceived ? new Date(lastHeartbeatReceived).toISOString() : null
    });
}

// Report status periodically (every second to match AlertStatusIndicator check interval)
statusInterval = setInterval(reportStatus, 1000) as unknown as number;
