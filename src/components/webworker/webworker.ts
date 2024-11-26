
var backendWebsocket: WebSocket | undefined;
var sevenTVWebsocket: WebSocket | undefined;

var backEndIsReady: (value?: unknown) => void;
var backendReady = new Promise((resolve) => {
    backEndIsReady = resolve;
});

var seventTVIsReady: (value?: unknown) => void;
var seventTVReady = new Promise((resolve) => {
    seventTVIsReady = resolve;
});


var initRequest: any | undefined;

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

function connectToSevenTV() {
    sevenTVWebsocket = new WebSocket('wss://events.7tv.io/v3');
    sevenTVWebsocket.onopen = function () {
        seventTVIsReady();
        console.log("Websocket to 7TV backend opened")
    };

    sevenTVWebsocket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);

        if (data.op === 0 && data.d.type === 'emote_set.update') {
            const body = data.d.body;
            const emoteSetId = body.id;

            body.pushed?.forEach((eW: {value: any}) => {
                const emote = eW.value;
                self.postMessage({type: 'seventTV', data: {type: 'add', emoteSetId, emote, user: body.actor.display_name}});
            });

            body.pulled?.forEach((eW: {old_value: any}) => {
                const emote = eW.old_value;
                self.postMessage({type: 'seventTV', data: {type: 'remove', emoteSetId, emote, user: body.actor.display_name}});
            });
            return;
        }
    };

    sevenTVWebsocket.onclose = function (e) {
        console.log('7TV Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        seventTVReady = new Promise((resolve) => {
            seventTVIsReady = resolve;
        });
        setTimeout(function () {
            connectToSevenTV();
        }, 1000);
    };

    sevenTVWebsocket.onerror = function (err: Event) {
        console.error('7TV Socket encountered error. Closing socket');
        sevenTVWebsocket?.close();
    };
}

connectToSevenTV();

const subscribeToSeventTVUpdates = async function (userId: string, objectId: string) {
    console.log('Subscribe to seventTV updates for: ' + userId);
    await seventTVReady;
    const emoteUpdate = {
        op: 35,
        d: {
            type: 'emote.*',
            condition: {
                object_id: userId
            }
        }
    };
    const emoteSetUpdate = {
        op: 35,
        d: {
            type: 'emote_set.*',
            condition: {
                object_id: objectId
            }
        }
    };

    sevenTVWebsocket?.send(JSON.stringify(emoteSetUpdate));
}

self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'SEND':
            if (data.type === 'subscribe') {
                initRequest = data;
            }
            if (data.type === 'sevenTVSubscribe') {
                subscribeToSeventTVUpdates(data.userId, data.objectId);
                return;
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