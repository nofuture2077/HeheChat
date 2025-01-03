import { Button } from '@mantine/core';
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { IconLink } from '@tabler/icons-react';
import { useEffect, useContext, useState } from 'react';
import { LoginContextContext } from '@/ApplicationContext';
import { generateGUID } from '@/commons/helper';
import PubSub from 'pubsub-js'

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

const AUTH_VERSION = 12;

export default function Login() {
    const loginContext = useContext(LoginContextContext);
    const hash = window.location.hash.substring(1);
    const authVersion: string | null = localStorage.getItem('hehe-auth-version');
    const tokenStored: string | null = (authVersion && Number(authVersion) >= AUTH_VERSION) ? localStorage.getItem('hehe-token') : null;
    const token: string | undefined = window.location.hash ? getQueryVariable(hash, "access_token") : undefined;
    const tokenState = window.location.hash ? getQueryVariable(hash, "state") : undefined;
    const [waitover, setWaitOver] = useState<boolean>(false);

    useEffect(() => {
        setTimeout(() => {
            setWaitOver(true);
        }, 5000);

        if (tokenStored || token) {
            const authProvider = new StaticAuthProvider(loginContext.clientId, tokenStored || token || '');
            const api = new ApiClient({authProvider});
            api.getTokenInfo().then((tokenInfo) => {
                api.users.getAuthenticatedUser({id: tokenInfo.userId || ''}).then((user) => {
                    loginContext.setUser(user);
                });

                api.moderation.getModeratedChannelsPaginated({id: tokenInfo.userId || ''}).getAll().then((moderatedChannels) => {
                    loginContext.setModeratedChannels(moderatedChannels);
                });

                if (tokenStored) {
                    loginContext.setAccessToken(tokenStored);
                }
                if (token) {
                    if (localStorage.getItem('hehe-token_state') !== tokenState) {
                        console.error('Token mismatched... not logged in');
                        return;
                    }
                    loginContext.setAccessToken(token);
                    localStorage.setItem('hehe-token', token);
                    localStorage.setItem('hehe-auth-version', AUTH_VERSION + "");
                    const redirectUrl = encodeURI(window.location.origin + window.location.pathname.replace("index.html", ""));
                    document.location = redirectUrl;
                }
            }, (err) => {
                console.error(err);
                localStorage.removeItem('hehe-token');
                localStorage.removeItem('hehe-token_state');
                loginContext.setAccessToken(undefined);
                const redirectUrl = encodeURI(window.location.origin + window.location.pathname.replace("index.html", ""));
                document.location = redirectUrl;
            });
        }
    }, [token]);

    const authUrl = import.meta.env.VITE_BACKEND_URL + "/twitchauth";

    let scope = [
        "bits:read",
        "channel:bot",
        "channel:manage:predictions",
        "channel:manage:raids",
        "channel:manage:redemptions",
        "channel:manage:ads",
        "channel:read:goals",
        "channel:read:hype_train",
        "channel:read:polls",
        "channel:read:predictions",
        "channel:read:redemptions",
        "channel:read:subscriptions",
        "channel:read:vips",
        "channel:read:ads",
        "channel:edit:commercial",
        "channel:manage:broadcast",
        "channel:moderate",
        "chat:edit",
        "chat:read",
        "clips:edit",
        "moderator:manage:announcements",
        "moderator:manage:blocked_terms",
        "moderator:manage:chat_messages",
        "moderator:manage:banned_users",
        "moderator:manage:unban_requests",
        "moderator:manage:chat_settings",
        "moderator:manage:warnings",
        "moderator:read:moderators",
        "moderator:read:vips",
        "moderator:read:chatters",
        "moderator:read:followers",
        "moderator:read:shield_mode",
        "moderator:read:shoutouts",
        "user:bot",
        "user:read:moderated_channels",
        "user:read:chat",
        "user:write:chat"
    ].map(encodeURIComponent).join('+');
    
    const onClick = () => {
        const state = generateGUID();
        localStorage.setItem('hehe-token_state', state);

        let responseType = encodeURIComponent('code');
        let link = `https://id.twitch.tv/oauth2/authorize?response_type=${responseType}&client_id=${loginContext.clientId}&redirect_uri=${authUrl}&scope=${scope}&state=${state}`;

        window.location.href = link;
    };

    return (<Button
            component="a"
            disabled={(!!(token || tokenStored) && !waitover)}
            size='xl'
            radius="xl"
            variant='gradient'
            gradient={{ from: 'var(--mantine-color-skyblue-8)', to: 'var(--mantine-color-paleviolet-6)', deg: 135 }}
            onClick={onClick}
            rightSection={<IconLink size={32} />}>    
            Login with Twitch
        </Button> );
}

PubSub.subscribe('WS-auth-update', (msg, data) => {
    console.log('Got new access token: ' + data.token);
    localStorage.setItem('hehe-token', data.token);
});