import { TextInput, Fieldset, Stack, Text } from '@mantine/core';
import { useState, useEffect } from 'react';

export function ConnectElevenLabsSettings() {
    const [apiKey, setApiKey] = useState("");
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/get?state=" + state)
            .then(res => res.json()).then((data) => setApiKey(data.apikey || ''));
    }, []);

    const update = (value: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/set?state=" + state + "&apikey=" + value);
        setApiKey(value);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Elevenlabs Config" variant="filled">
                <Text size="sm" mb={10}>
                    To connect ElevenLabs with HeheChat:
                    <ol>
                        <li>Go to <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">ElevenLabs</a> and log into your account</li>
                        <li>Navigate to your profile settings</li>
                        <li>Create an API key</li>
                        <li>Copy the API key and paste it below</li>
                    </ol>
                </Text>
                <TextInput label="API Key" placeholder="Enter your ElevenLabs API key" value={apiKey} onChange={(ev) => update(ev.target.value)} />
            </Fieldset>
        </Stack>
    );
}
