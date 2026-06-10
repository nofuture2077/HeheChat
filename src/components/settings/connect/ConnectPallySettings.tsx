import { TextInput, Fieldset, Stack, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export function ConnectPallySettings() {
    const [apiKey, setApiKey] = useState("");
    const [channel, setChannel] = useState("");
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/get?state=" + state)
            .then(res => res.json()).then((data) => {
                setApiKey(data.apikey || '');
                setChannel(data.channel || '');
            });
    }, []);

    const update = (key: string, ch: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/set?state=" + state + "&apikey=" + key + "&channel=" + ch);
        setApiKey(key);
        setChannel(ch);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Pally.gg is a donation and campaign platform for streamers. Connect your API key and campaign slug so HeheChat can receive Pally.gg donation events and display them in your alert feed.
            </Alert>
            <Fieldset legend="Pally.gg Config" variant="filled">
                <Text size="sm" mb={10}>
                    To connect Pally.gg with HeheChat:
                    <ol>
                        <li>Go to <a href="https://pally.gg" target="_blank" rel="noopener noreferrer">Pally.gg</a> and log into your account</li>
                        <li>Create an API key in your account settings</li>
                        <li>Create a campaign page with a custom slug</li>
                        <li>Enter both the API key and campaign slug below</li>
                    </ol>
                </Text>
                <TextInput label="API Key" placeholder="Enter your Pally.gg API key" value={apiKey} onChange={(ev) => update(ev.target.value, channel)} />
                <TextInput label="Pally Slug" placeholder="Enter your campaign page slug" value={channel} onChange={(ev) => update(apiKey, ev.target.value)} />
            </Fieldset>
        </Stack>
    );
}
