/* eslint-disable no-restricted-globals */

let backendWebsocket: WebSocket | undefined;
let backEndIsReady: (value?: unknown) => void;
let backendReady = new Promise((resolve) => {
    backEndIsReady = resolve;
});

let initRequest: any | undefined;

function connectToBackend() {
    backendWebsocket = new WebSocket(import.meta.env.VITE_BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://"));
    backendWebsocket.onopen = function () {
        backEndIsReady();
        console.log("Websocket to backend opened")
        if (initRequest) {
            backendWebsocket?.send(JSON.stringify(initRequest));
        }
    };

    backendWebsocket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        self.postMessage(data);
    };

    backendWebsocket.onclose = function (e) {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(function () {
            connectToBackend();
        }, 1000);
    };

    backendWebsocket.onerror = function (err: Event) {
        console.error('Socket encountered error. Closing socket');
        backendWebsocket?.close();
    };
}

connectToBackend();

self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'SEND':
            if ((data.type === "subscribe" && data.source === "HeheChat App") || 
                (data.type === "sink" && data.source === "Browsersource") ) {
                initRequest = data;
            }
            await backendReady;
            backendWebsocket?.send(JSON.stringify(data));
            break;
        case 'STOP':
            close();
            break;
        default:
            break;
    }
};
