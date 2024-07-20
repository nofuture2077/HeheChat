"use client";

import { Button } from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import { useEffect, useState, useContext } from 'react';
import { LoginContext } from '../../ApplicationContext';

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
    const [redirectUrl, setRedirectUrl] = useState<string | null>();
    const loginContext = useContext(LoginContext);

    const token: string | undefined = window.location.hash ? getQueryVariable(window.location.hash.substring(1), "access_token") : undefined;

    useEffect(() => {
        if (token) {
            loginContext.setAccessToken(token);
        }
    }, [token]);

    if (token) {
        return null;
    }

    useEffect(() => {
        const url = window.location.origin + window.location.pathname.replace("index.html", "");
        setRedirectUrl(encodeURI(url));
    }, []);
    var state = '';
    let scope = ['chat:read', 'chat:edit', 'user:write:chat'].map(encodeURIComponent).join('+');
    
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