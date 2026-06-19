import { TextInput, Fieldset, Stack, Text, Alert, Button, Badge, Group } from '@mantine/core';
import { IconInfoCircle, IconPlug } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export function ConnectPallySettings() {
    const [apiKey, setApiKey] = useState("");
    const [channel, setChannel] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        setLoading(true);
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/get?state=" + state)
            .then(res => res.json())
            .then((data) => {
                if (data.apikey) {
                    setApiKey(data.apikey);
                    setChannel(data.channel || '');
                    setConnected(true);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/set?state=" + state + "&apikey=" + apiKey + "&channel=" + channel);
            setConnected(true);
        } catch (error) {
            alert("Failed to save Pally.gg config");
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Pally.gg?')) return;
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/set?state=" + state + "&apikey=&channel=");
            setApiKey("");
            setChannel("");
            setConnected(false);
        } catch (error) {
            alert("Failed to disconnect Pally.gg");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Pally.gg is a donation and campaign platform for streamers. Connect your API key and campaign slug so HeheChat can receive Pally.gg donation events and display them in your alert feed.
            </Alert>
            <Fieldset legend="Pally.gg Config" variant="filled">
                <Stack gap="md">
                    {connected ? (
                        <Stack gap="sm">
                            <Group>
                                <Badge color="green" size="lg">✅ Connected</Badge>
                            </Group>
                            <Text size="sm">Setup completed. Your Pally.gg account is connected (Slug: {channel}).</Text>
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>Disconnect Pally.gg</Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To connect Pally.gg with HeheChat:
                                <ol>
                                    <li>Go to <a href="https://pally.gg" target="_blank" rel="noopener noreferrer">Pally.gg</a> and log into your account</li>
                                    <li>Create an API key in your account settings</li>
                                    <li>Create a campaign page with a custom slug</li>
                                    <li>Enter both the API key and campaign slug below</li>
                                </ol>
                            </Text>
                            <TextInput
                                label="API Key"
                                placeholder="Enter your Pally.gg API key"
                                value={apiKey}
                                onChange={(ev) => setApiKey(ev.target.value)}
                            />
                            <TextInput
                                label="Pally Slug"
                                placeholder="Enter your campaign page slug"
                                value={channel}
                                onChange={(ev) => setChannel(ev.target.value)}
                            />
                            <Button
                                leftSection={<IconPlug size={20} />}
                                onClick={save}
                                loading={loading}
                                disabled={!apiKey.trim() || !channel.trim()}
                            >
                                Connect Pally.gg
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
