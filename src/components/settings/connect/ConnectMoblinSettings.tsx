import { TextInput, PasswordInput, Fieldset, Stack, Text, Alert, Button, Checkbox, Group, ActionIcon, Badge, Switch } from '@mantine/core';
import { IconInfoCircle, IconPlug, IconCopy } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function ConnectMoblinSettings() {
    const config = useContext(ConfigContext);
    const [password, setPassword] = useState('');
    const [wsUrl, setWsUrl] = useState('');
    const [configured, setConfigured] = useState(false);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        setLoading(true);
        fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/get?state=' + state)
            .then(res => res.json())
            .then((data) => {
                if (data.configured) {
                    setConfigured(true);
                    setWsUrl(data.wsUrl || '');
                }
                setConnected(!!data.connected);
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setLoading(true);
        try {
            const res = await fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/set?state=' + state + '&password=' + encodeURIComponent(password));
            const data = await res.json();
            setConfigured(true);
            setWsUrl(data.wsUrl || '');
            setPassword('');
        } catch {
            alert('Failed to save Moblin config');
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Moblin?')) return;
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/set?state=' + state + '&password=');
            setConfigured(false);
            setConnected(false);
            setWsUrl('');
            setPassword('');
        } catch {
            alert('Failed to disconnect Moblin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Moblin is an iOS live streaming app. Connect HeheChat to control scenes and camera zoom directly from the stream status bar. Requires a HeheChat Pro subscription.
            </Alert>
            <Fieldset legend="Moblin Remote Control" variant="filled">
                <Stack gap="md">
                    {configured ? (
                        <Stack gap="sm">
                            <Group>
                                <Checkbox defaultChecked readOnly color="lime.4" size="md" />
                                <div>
                                    <Group gap="xs">
                                        <Text>Configured</Text>
                                        <Badge color={connected ? 'green' : 'gray'} size="sm">
                                            {connected ? 'Connected' : 'Not connected'}
                                        </Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed">
                                        {connected ? 'Moblin is actively connected.' : 'Waiting for Moblin to connect.'}
                                    </Text>
                                </div>
                            </Group>
                            <TextInput
                                label="WebSocket URL"
                                description="Enter this URL in Moblin → Settings → Remote Control"
                                value={wsUrl}
                                readOnly
                                rightSection={
                                    <ActionIcon variant="subtle" onClick={() => navigator.clipboard.writeText(wsUrl)}>
                                        <IconCopy size="1rem" />
                                    </ActionIcon>
                                }
                            />
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>
                                Disconnect Moblin
                            </Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To connect Moblin with HeheChat:
                                <ol>
                                    <li>Enter a password below and click Connect</li>
                                    <li>Copy the generated WebSocket URL</li>
                                    <li>In Moblin: Settings → Remote Control → enable and paste the URL and password</li>
                                </ol>
                            </Text>
                            <PasswordInput
                                label="Password"
                                placeholder="Enter a password for Moblin to use"
                                value={password}
                                onChange={(ev) => setPassword(ev.target.value)}
                            />
                            <Button
                                leftSection={<IconPlug size={20} />}
                                onClick={save}
                                loading={loading}
                                disabled={!password.trim()}
                            >
                                Connect Moblin
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
            <Fieldset legend="Stream Status Bar" variant="filled">
                <Stack gap="sm">
                    <Switch
                        label="Show Moblin Control"
                        size="lg"
                        checked={config.showMoblinZoom}
                        onChange={e => config.setShowMoblinZoom(e.currentTarget.checked)}
                    />
                    <Text fs="italic" size="14px">Show Moblin scene switcher and zoom control in the stream status bar</Text>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
