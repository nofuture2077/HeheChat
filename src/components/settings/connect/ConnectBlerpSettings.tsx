import { TextInput, Fieldset, Stack, Text, Switch, Alert, Button, Checkbox, Group } from '@mantine/core';
import { IconInfoCircle, IconPlug } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../../ApplicationContext';

function extractBlerpRoom(input: string): string {
    const match = input.match(/\/([^/]+)$/);
    return match ? match[1] : input;
}

export function ConnectBlerpSettings() {
    const [roomId, setRoomId] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';
    const config = useContext(ConfigContext);

    useEffect(() => {
        setLoading(true);
        fetch(import.meta.env.VITE_BACKEND_URL + "/blerp/get?state=" + state)
            .then(res => res.json())
            .then((data) => {
                if (data.roomid) {
                    setRoomId(data.roomid);
                    setConnected(true);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        const id = extractBlerpRoom(roomId);
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/blerp/set?state=" + state + "&roomId=" + id);
            setRoomId(id);
            setConnected(true);
        } catch (error) {
            alert("Failed to save Blerp config");
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Blerp room?')) return;
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/blerp/set?state=" + state + "&roomId=");
            setRoomId("");
            setConnected(false);
        } catch (error) {
            alert("Failed to disconnect Blerp");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Blerp lets viewers play sound clips during your stream via Channel Points. Connect your Blerp room so HeheChat can receive and display Blerp events in your chat and alert feed.
            </Alert>
            <Fieldset legend="Blerp Config" variant="filled">
                <Stack gap="md">
                    <Switch
                        label="Enable Blerp alerts"
                        description="Receive and display Blerp events in chat"
                        checked={!config.deactivatedAlerts['blerp']}
                        onChange={(ev) => config.setDeactivatedAlerts('blerp', !ev.currentTarget.checked)}
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
                                        Room ID: {roomId}
                                        </Text>
                                    </div>
                            </Group>
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>Disconnect Blerp</Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To connect Blerp with HeheChat:
                                <ol>
                                    <li>Go to <a href="https://blerp.com/dashboard" target="_blank" rel="noopener noreferrer">Blerp Dashboard</a></li>
                                    <li>Navigate to OBS Browser Source section</li>
                                    <li>Copy the URL provided</li>
                                    <li>Paste the URL below</li>
                                </ol>
                            </Text>
                            <TextInput
                                label="Room URL/ID"
                                placeholder="Enter Blerp room URL or ID"
                                value={roomId}
                                onChange={(ev) => setRoomId(ev.target.value)}
                                description="HeheChat will extract the room ID automatically"
                            />
                            <Button
                                leftSection={<IconPlug size={20} />}
                                onClick={save}
                                loading={loading}
                                disabled={!roomId.trim()}
                            >
                                Connect Blerp
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
