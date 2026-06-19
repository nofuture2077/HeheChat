import { TextInput, Fieldset, Stack, Text, Switch, Alert, Button, Checkbox, Group } from '@mantine/core';
import { IconInfoCircle, IconPlug } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../../ApplicationContext';

export function ConnectSoundAlertsSettings() {
    const [overlayUrl, setOverlayUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';
    const config = useContext(ConfigContext);

    useEffect(() => {
        setLoading(true);
        fetch(import.meta.env.VITE_BACKEND_URL + "/soundalerts/get?state=" + state)
            .then(res => res.json())
            .then((data) => {
                if (data.overlay_id) {
                    setConnected(true);
                    // Note: overlay_id is returned, but we don't have the original URL
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/soundalerts/set?state=" + state + "&overlayUrl=" + encodeURIComponent(overlayUrl));
            setConnected(true);
        } catch (error) {
            alert("Failed to save SoundAlerts config");
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect SoundAlerts?')) return;
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/soundalerts/set?state=" + state + "&overlayUrl=");
            setOverlayUrl("");
            setConnected(false);
        } catch (error) {
            alert("Failed to disconnect SoundAlerts");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                SoundAlerts lets your viewers trigger sound effects via Channel Points or bits. Connecting the overlay URL allows HeheChat to receive and display SoundAlert events in your chat and alert feed.
            </Alert>
            <Fieldset legend="SoundAlerts Config" variant="filled">
                <Stack gap="md">
                    <Switch
                        label="Enable SoundAlerts alerts"
                        description="Receive and display SoundAlerts events in chat"
                        checked={!config.deactivatedAlerts['soundalerts']}
                        onChange={(ev) => config.setDeactivatedAlerts('soundalerts', !ev.currentTarget.checked)}
                    />

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
                                        Your Soundalerts account is configured.
                                        </Text>
                                    </div>
                            </Group>
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>Disconnect SoundAlerts</Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To connect SoundAlerts with HeheChat:
                                <ol>
                                    <li>Go to <a href="https://soundalerts.com" target="_blank" rel="noopener noreferrer">soundalerts.com</a></li>
                                    <li>Navigate to OBS Browser Source section</li>
                                    <li>Copy the URL provided</li>
                                    <li>Paste the URL below</li>
                                </ol>
                            </Text>
                            <TextInput
                                label="Overlay URL"
                                placeholder="https://source.soundalerts.com/overlay/..."
                                value={overlayUrl}
                                onChange={(ev) => setOverlayUrl(ev.target.value)}
                            />
                            <Button
                                leftSection={<IconPlug size={20} />}
                                onClick={save}
                                loading={loading}
                                disabled={!overlayUrl.trim()}
                            >
                                Connect SoundAlerts
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
