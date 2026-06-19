import { TextInput, Fieldset, Stack, Text, Alert, Button, Badge, Group } from '@mantine/core';
import { IconInfoCircle, IconPlug } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export function ConnectStreamElementsSettings() {
    const [jwt, setJwt] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        setLoading(true);
        fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/get?state=" + state)
            .then(res => res.json())
            .then((data) => {
                if (data.jwt) {
                    setJwt(data.jwt);
                    setConnected(true);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/set?state=" + state + "&jwt=" + jwt);
            setConnected(true);
        } catch (error) {
            alert("Failed to save StreamElements config");
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect StreamElements?')) return;
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/set?state=" + state + "&jwt=");
            setJwt("");
            setConnected(false);
        } catch (error) {
            alert("Failed to disconnect StreamElements");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                StreamElements provides donation and tip alerts. Connect your JWT token so HeheChat can receive StreamElements tip events and display them in your chat and alert feed.
            </Alert>
            <Fieldset legend="Streamelements Config" variant="filled">
                <Stack gap="md">
                    {connected ? (
                        <Stack gap="sm">
                            <Group>
                                <Badge color="green" size="lg">✅ Connected</Badge>
                            </Group>
                            <Text size="sm">Setup completed. Your StreamElements account is connected.</Text>
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>Disconnect StreamElements</Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To connect StreamElements with HeheChat:
                                <ol>
                                    <li>Go to <a href="https://streamelements.com/dashboard" target="_blank" rel="noopener noreferrer">StreamElements Dashboard</a></li>
                                    <li>Login to your account</li>
                                    <li>Navigate to Dashboard → Profile → Channel Settings</li>
                                    <li>Copy the JWT token</li>
                                    <li>Paste it in the field below</li>
                                </ol>
                            </Text>
                            <TextInput
                                label="JWT"
                                placeholder="Enter your StreamElements JWT token"
                                value={jwt}
                                onChange={(ev) => setJwt(ev.target.value)}
                            />
                            <Button
                                leftSection={<IconPlug size={20} />}
                                onClick={save}
                                loading={loading}
                                disabled={!jwt.trim()}
                            >
                                Connect StreamElements
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
