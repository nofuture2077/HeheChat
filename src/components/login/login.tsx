import { Button } from '@mantine/core';
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { IconLogin } from '@tabler/icons-react';
import { useEffect, useState, useContext } from 'react';
import { ChatEmotesContext, LoginContextContext } from '@/ApplicationContext';
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

export default function Login() {
    const loginContext = useContext(LoginContextContext);
    const chatEmotes = useContext(ChatEmotesContext);
    const hash = window.location.hash.substring(1);
    const tokenStored: string | null = localStorage.getItem('hehe-token');
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

    const redirectUrl = encodeURI(window.location.origin + window.location.pathname.replace("index.html", ""));

    const state = generateGUID();
    localStorage.setItem('hehe-token_state', state);

    let scope = [
        // chatter scopes
        'chat:read',
        'chat:edit',
        'user:write:chat',
        // mod scopes
        'user:read:moderated_channels',
        'moderator:manage:chat_messages',
        'moderator:manage:banned_users',
        'moderator:manage:shoutouts',
        // broadcaster
        'channel:manage:raids'
    ].map(encodeURIComponent).join('+');
    
    let responseType = encodeURIComponent('token');
    let authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=${responseType}&client_id=${loginContext.clientId}&redirect_uri=${redirectUrl}&scope=${scope}&state=${state}`;

    return (<Button
            component="a"
            size='xl'
            radius="xl"
            variant='gradient'
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            href={authUrl}
            rightSection={<IconLogin size={32} />}>    
            Login with Twitch
        </Button> );
  }