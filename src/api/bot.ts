const BASE_URL = import.meta.env.VITE_BACKEND_URL;

function token() {
    return localStorage.getItem('hehe-token_state') || '';
}

export interface BotAccount {
    channel: string;
    bot_userid: string;
    bot_username: string;
}

export interface PutBotResponse {
    ok: boolean;
    bot_userid: string;
    bot_username: string;
}

export async function getBot(channel: string): Promise<BotAccount | null> {
    const res = await fetch(`${BASE_URL}/api/bot/${channel}?token=${token()}`);
    if (res.status === 404) return null;
    const data = await res.json();
    return data ?? null;
}

export async function putBot(channel: string, access_token: string): Promise<PutBotResponse> {
    const res = await fetch(`${BASE_URL}/api/bot/${channel}?token=${token()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token }),
    });
    return res.json();
}

export async function getBotAuthUrl(channel: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/bot/${channel}/auth-url?token=${token()}`);
    const data = await res.json();
    return data.url as string;
}

export async function deleteBot(channel: string): Promise<void> {
    await fetch(`${BASE_URL}/api/bot/${channel}?token=${token()}`, {
        method: 'DELETE',
    });
}
