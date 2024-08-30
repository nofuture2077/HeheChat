import { Button } from '@mantine/core';
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { IconLogin } from '@tabler/icons-react';
import { useEffect, useContext } from 'react';
import { LoginContextContext } from '@/ApplicationContext';
import { generateGUID } from '@/commons/helper';

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

const AUTH_VERSION = 4;

export default function Login() {
    const loginContext = useContext(LoginContextContext);
    const hash = window.location.hash.substring(1);
    const authVersion: string | null = localStorage.getItem('hehe-auth-version');
    const tokenStored: string | null = (authVersion && Number(authVersion) >= AUTH_VERSION) ? localStorage.getItem('hehe-token') : null;
    const token: string | undefined = window.location.hash ? getQueryVariable(hash, "access_token") : undefined;
    const tokenState = window.location.hash ? getQueryVariable(hash, "state") : undefined;

    useEffect(() => {
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
                loginContext.setAccessToken(undefined);
            });
        }
    }, [token]);

    if (tokenStored || token) {
        return null;
    }

    const state = generateGUID();
    localStorage.setItem('hehe-token_state', state);

    const authUrl = import.meta.env.VITE_BACKEND_URL + "/twitchauth";

    let scope = [
        "bits:read",
        "channel:bot",
        "channel:manage:predictions",
        "channel:manage:raids",
        "channel:manage:redemptions",
        "channel:read:goals",
        "channel:read:hype_train",
        "channel:read:polls",
        "channel:read:predictions",
        "channel:read:redemptions",
        "channel:read:subscriptions",
        "channel:read:vips",
        "chat:edit",
        "chat:read",
        "clips:edit",
        "moderator:manage:announcements",
        "moderator:read:chatters",
        "moderator:read:followers",
        "moderator:read:shield_mode",
        "moderator:read:shoutouts",
        "user:bot",
        "user:read:moderated_channels",
        "user:read:chat",
        "user:write:chat"
    ].map(encodeURIComponent).join('+');
    
    let responseType = encodeURIComponent('code');
    let link = `https://id.twitch.tv/oauth2/authorize?response_type=${responseType}&client_id=${loginContext.clientId}&redirect_uri=${authUrl}&scope=${scope}&state=${state}`;

    return (<Button
            component="a"
            size='xl'
            radius="xl"
            variant='gradient'
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            href={link}
            rightSection={<IconLogin size={32} />}>    
            Login with Twitch
        </Button> );
  }