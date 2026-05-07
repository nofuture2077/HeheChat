import { TextInput, Fieldset, Stack, Text } from '@mantine/core';
import { useState, useEffect } from 'react';

export function ConnectStreamElementsSettings() {
    const [jwt, setJwt] = useState("");
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/get?state=" + state)
            .then(res => res.json()).then((data) => setJwt(data.jwt || ''));
    }, []);

    const update = (value: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/set?state=" + state + "&jwt=" + value);
        setJwt(value);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Streamelements Config" variant="filled">
                <Text size="sm" mb={10}>
                    To connect StreamElements with HeheChat:
                    <ol>
                        <li>Go to <a href="https://streamelements.com/dashboard" target="_blank" rel="noopener noreferrer">StreamElements Dashboard</a></li>
                        <li>Login to your account</li>
                        <li>Navigate to Dashboard → Profile → Channel Settings</li>
                        <li>Copy the JWT token</li>
                        <li>Paste it in the field below</li>
                    </ol>
                </Text>
                <TextInput label="JWT" placeholder="Enter your StreamElements JWT token" value={jwt} onChange={(ev) => update(ev.target.value)} />
            </Fieldset>
        </Stack>
    );
}
