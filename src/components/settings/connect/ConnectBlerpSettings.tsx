import { TextInput, Fieldset, Stack, Text, Switch } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../../ApplicationContext';

function extractBlerpRoom(input: string): string {
    const match = input.match(/\/([^/]+)$/);
    return match ? match[1] : input;
}

export function ConnectBlerpSettings() {
    const [roomId, setRoomId] = useState("");
    const state = localStorage.getItem('hehe-token_state') || '';
    const config = useContext(ConfigContext);

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/blerp/get?state=" + state)
            .then(res => res.json()).then((data) => setRoomId(data.roomid || ''));
    }, []);

    const update = (input: string) => {
        const id = extractBlerpRoom(input);
        fetch(import.meta.env.VITE_BACKEND_URL + "/blerp/set?state=" + state + "&roomId=" + id);
        setRoomId(id);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Blerp Config" variant="filled">
                <Switch
                    label="Enable Blerp"
                    checked={!config.deactivatedAlerts['blerp']}
                    onChange={(ev) => config.setDeactivatedAlerts('blerp', !ev.currentTarget.checked)}
                    mb={12}
                />
                <Text size="sm" mb={10}>
                    To connect Blerp with HeheChat:
                    <ol>
                        <li>Go to <a href="https://blerp.com/dashboard" target="_blank" rel="noopener noreferrer">Blerp Dashboard</a></li>
                        <li>Navigate to OBS Browser Source section</li>
                        <li>Copy the URL provided</li>
                        <li>Paste the URL below (HeheChat will extract the room ID automatically)</li>
                    </ol>
                </Text>
                <TextInput label="Room URL/ID" placeholder="Enter Blerp room URL or ID" value={roomId} onChange={(ev) => update(ev.target.value)} />
            </Fieldset>
        </Stack>
    );
}
