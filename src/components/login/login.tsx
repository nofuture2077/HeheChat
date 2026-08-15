import { Menu } from '@mantine/core';
import { ApiClient } from '@twurple/api';
import { IconLink, IconChevronDown } from '@tabler/icons-react';
import React, { useEffect, useContext, useState } from 'react';
import { LoginContextContext } from '@/ApplicationContext';
import { generateGUID } from '@/commons/helper';
import { LOGIN_SCOPES, AUTH_VERSION, createTrustedAuthProvider, handleUnauthorized } from '@/commons/login';
import { EmoteStore } from '@/components/chat/emotestorage';
import PubSub from 'pubsub-js'
import { DEFAULT_CHAT_EMOTES } from '@/commons/emotes'
import classes from './login.module.css'

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

interface LoginProps {
    color1: string;
    color2: string;
    target: string;
    clientId: string;
}

export default function Login(props: LoginProps) {
    const loginContext = useContext(LoginContextContext);
    const hash = window.location.hash.substring(1);
    const authVersion: string | null = localStorage.getItem('hehe-auth-version');
    const tokenStored: string | null = (authVersion && Number(authVersion) >= AUTH_VERSION) ? localStorage.getItem('hehe-token') : null;
    const token: string | undefined = window.location.hash ? getQueryVariable(hash, "access_token") : undefined;
    const tokenState = window.location.hash ? getQueryVariable(hash, "state") : undefined;
    const userIdFromHash: string | undefined = window.location.hash ? getQueryVariable(hash, "userid") : undefined;
    const userIdStored: string | null = localStorage.getItem('hehe-userid');
    const [waitover, setWaitOver] = useState<boolean>(false);

    useEffect(() => {
        setTimeout(() => {
            setWaitOver(true);
        }, 5000);

        const botAuth = getQueryVariable(hash, 'bot_auth');
        if (botAuth === 'success') {
            const redirectUrl = encodeURI(window.location.origin + window.location.pathname.replace("index.html", ""));
            document.location = redirectUrl;
            return;
        }

        if (token && localStorage.getItem('hehe-token_state') !== tokenState) {
            console.error('[login] Token mismatched... not logged in');
            return;
        }

        const userId = (token ? userIdFromHash : userIdStored) || '';

        if ((tokenStored || token) && userId) {
            const authProvider = createTrustedAuthProvider(props.clientId, tokenStored || token || '', userId);
            const api = new ApiClient({authProvider});

            DEFAULT_CHAT_EMOTES.updateUserEmote(userId);
            api.users.getAuthenticatedUser({id: userId}).then((user) => {
                loginContext.setUser(user);
            }).catch((err) => {
                if (!handleUnauthorized(err?.statusCode)) console.error('[login] failed to load user', err);
            });

            api.moderation.getModeratedChannelsPaginated({id: userId}).getAll().then((moderatedChannels) => {
                loginContext.setModeratedChannels(moderatedChannels);
            }).catch((err) => {
                if (!handleUnauthorized(err?.statusCode)) console.error('[login] failed to load moderated channels', err);
            });

            if (tokenStored) {
                loginContext.setAccessToken(tokenStored);
            }
            if (token) {
                loginContext.setAccessToken(token);
                localStorage.setItem('hehe-token', token);
                localStorage.setItem('hehe-userid', userId);
                localStorage.setItem('hehe-auth-version', AUTH_VERSION + "");
                const redirectUrl = encodeURI(window.location.origin + window.location.pathname.replace("index.html", ""));
                document.location = redirectUrl;
            }
        } else if (tokenStored && !userId) {
            // Stored token predates userid caching (old AUTH_VERSION) - drop it and force a fresh login.
            console.error('[login] no cached userid for stored token, clearing session');
            localStorage.removeItem('hehe-token');
            localStorage.removeItem('hehe-token_state');
            localStorage.removeItem('hehe-userid');
            loginContext.setAccessToken(undefined);
        }
    }, [token]);

    const authUrl = import.meta.env.VITE_BACKEND_URL + props.target;

    let scope = LOGIN_SCOPES.map(encodeURIComponent).join('+');
    
    const buildAuthUrl = (forceVerify: boolean) => {
        const state = generateGUID();
        localStorage.setItem('hehe-token_state', state);
        const responseType = encodeURIComponent('code');
        const forceVerifyParam = forceVerify ? '&force_verify=true' : '';
        return `https://id.twitch.tv/oauth2/authorize?response_type=${responseType}&client_id=${props.clientId}&redirect_uri=${authUrl}&scope=${scope}&state=${state}${forceVerifyParam}`;
    };

    const onClick = () => { window.location.href = buildAuthUrl(false); };
    const onClickForceVerify = () => { window.location.href = buildAuthUrl(true); };

    const disabled = (!!(token || tokenStored) && !waitover);
    const radius = 'var(--mantine-radius-xl)';
    const wrapperStyle: React.CSSProperties = {
        display: 'inline-flex',
        borderRadius: radius,
        overflow: 'hidden',
        background: `linear-gradient(45deg, ${props.color1}, ${props.color2})`,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : undefined,
    };
    const btnStyle: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        color: 'white',
        height: 50,
        padding: '0 20px',
        fontSize: 'var(--mantine-font-size-lg)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
    };
    const dividerStyle: React.CSSProperties = {
        width: 1,
        background: 'rgba(255,255,255,0.35)',
        alignSelf: 'stretch',
        margin: '8px 0',
    };
    const wrapperClassName = `${classes.wrapper} ${disabled ? classes.wrapperLoading : ''}`.trim();

    return (
        <div className={wrapperClassName} style={wrapperStyle}>
            <button disabled={disabled} style={btnStyle} onClick={onClick}>
                <IconLink size={20} /> Login with Twitch
            </button>
            <div style={dividerStyle} />
            <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                    <button
                        disabled={disabled}
                        aria-label="More login options"
                        style={{ ...btnStyle, padding: '0 14px' }}>
                        <IconChevronDown size={16} />
                    </button>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={onClickForceVerify}>
                        Use another account
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </div>
    );
}

PubSub.subscribe('WS-auth-update', (msg, data) => {
    console.log('Got new access token: ' + data.token);
    localStorage.setItem('hehe-token', data.token);
});
