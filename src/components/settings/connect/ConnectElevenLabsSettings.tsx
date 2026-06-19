import { TextInput, Fieldset, Stack, Text, Alert, Button, Checkbox, Group } from '@mantine/core';
import { IconInfoCircle, IconPlug } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export function ConnectElevenLabsSettings() {
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        setLoading(true);
        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/get?state=" + state)
            .then(res => res.json())
            .then((data) => {
                if (data.apikey) {
                    setApiKey(data.apikey);
                    setConnected(true);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/set?state=" + state + "&apikey=" + apiKey);
            setConnected(true);
        } catch (error) {
            alert("Failed to save ElevenLabs config");
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your ElevenLabs account?')) return;
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/set?state=" + state + "&apikey=");
            setApiKey("");
            setConnected(false);
        } catch (error) {
            alert("Failed to disconnect ElevenLabs");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                ElevenLabs provides high-quality AI text-to-speech voices for TTS alerts and chat. Connect your account with an API key to unlock Deluxe TTS Voices (Premium feature). Usage counts against your ElevenLabs quota — be mindful when sharing alerts with AI-TTS enabled.
            </Alert>
            <Fieldset legend="Elevenlabs Config" variant="filled">
                <Stack gap="md">
                    {connected ? (
                        <Stack gap="sm">
                            <Group>
                                <Checkbox
                                    defaultChecked
                                    readOnly
                                    color="lime.4"
                                    size="md"
                                    />
                                    <div>
                                        <Text>Configured</Text>
                                        <Text size="xs" c="dimmed">
                                        Your ElevenLabs account is configured.
                                        </Text>
                                    </div>
                            </Group>
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>Disconnect ElevenLabs</Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To connect ElevenLabs with HeheChat:
                                <ol>
                                    <li>Go to <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">ElevenLabs</a> and log into your account</li>
                                    <li>Navigate to your profile settings</li>
                                    <li>Create an API key</li>
                                    <li>Copy the API key and paste it below</li>
                                </ol>
                            </Text>
                            <TextInput
                                label="API Key"
                                placeholder="Enter your ElevenLabs API key"
                                value={apiKey}
                                onChange={(ev) => setApiKey(ev.target.value)}
                            />
                            <Button
                                leftSection={<IconPlug size={20} />}
                                onClick={save}
                                loading={loading}
                                disabled={!apiKey.trim()}
                            >
                                Connect ElevenLabs
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
