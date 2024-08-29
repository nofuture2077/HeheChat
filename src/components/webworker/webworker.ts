
var ws: WebSocket | undefined;

function connect() {
    ws = new WebSocket(import.meta.env.VITE_BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://"));
    ws.onopen = function() {
        console.log("websocket open")
    };
  
    ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        self.postMessage(data);
    };
  
    ws.onclose = function(e) {
      console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
      setTimeout(function() {
        connect();
      }, 1000);
    };
  
    ws.onerror = function(err: Event) {
      console.error('Socket encountered error. Closing socket');
      ws?.close();
    };
}
  
connect();

self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'SEND':
            ws?.send(JSON.stringify(data));
          break;
        case 'STOP':
          close();
          break;
    
        default:
          break;
      }
};