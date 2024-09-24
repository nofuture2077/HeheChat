
function getQueryVariable(query: String, variable: String): string | undefined {
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
  }

function toText(s: string) {
    return s.replaceAll(/##(.*?)##/g, function (m, p1) {
        return '<span class="highlight">' + p1.split('').map((x: string) => '<span>' + x + '</span>').join('') + '</span>'
    });
}

var alertConfigs: any = {};

function getImage(ref: string, channel: string) {
    if (alertConfigs && alertConfigs[channel] && alertConfigs[channel].data && alertConfigs[channel].data.files && alertConfigs[channel].data.files[ref]) {
        const file = alertConfigs[channel].data.files[ref];
        return 'data:' + file.mime + ';base64,' + file.data;
    }
    return "";
}

function showAlert(alert: {text: string, headline: string, image: string, duration: number, channel: string}) {
    document!.getElementById('headline')!.innerHTML = toText(alert.headline);
    document!.getElementById('text')!.innerText = alert.text;
    document!.getElementById('image')!.setAttribute("src",  getImage(alert.image, alert.channel));

    document!.getElementById('alert')!.style.visibility = 'visible';
    setTimeout(() => {
        document!.getElementById('alert')!.style.visibility = 'hidden';
    }, alert.duration);
}

function connectToServer(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        var backendWebsocket = new WebSocket(import.meta.env.VITE_BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://"));
        backendWebsocket.onopen = function () {
            console.log("Websocket to backend opened")
            resolve(backendWebsocket);
        };

        backendWebsocket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'sharedata') {
                alertConfigs = data.data;
            }
            
            if (data.type === 'alert') {
                showAlert(data.data);
                console.log(data);
            }
        };

        backendWebsocket.onclose = function (e) {
            console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
            setTimeout(async function () {
                backendWebsocket = await connectToServer();
            }, 1000);
        };

        backendWebsocket.onerror = function (err) {
            console.error('Socket encountered error. Closing socket');
            backendWebsocket?.close();
        };
    });

}

connectToServer().then(socket => {
    const query = window.location.search.substring(1);
    socket.send(JSON.stringify({ type: 'sink', token: getQueryVariable(query, "token") }));
});
