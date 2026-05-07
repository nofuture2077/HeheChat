import { TextInput, Fieldset, Stack, Text } from '@mantine/core';
import { useState, useEffect } from 'react';

export function ConnectSoundAlertsSettings() {
    const [overlayUrl, setOverlayUrl] = useState("");
    const [connected, setConnected] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/soundalerts/get?state=" + state)
            .then(res => res.json()).then((data) => setConnected(!!data.overlay_id));
    }, []);

    const update = (url: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/soundalerts/set?state=" + state + "&overlayUrl=" + encodeURIComponent(url));
        setOverlayUrl(url);
        setConnected(false);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="SoundAlerts Config" variant="filled">
                <Text size="sm" mb={10}>
                    To connect SoundAlerts with HeheChat:
                    <ol>
                        <li>Go to <a href="https://soundalerts.com" target="_blank" rel="noopener noreferrer">soundalerts.com</a></li>
                        <li>Navigate to OBS Browser Source section</li>
                        <li>Copy the URL provided</li>
                        <li>Paste the URL below</li>
                    </ol>
                </Text>
                {connected && <Text size="sm" c="green" mb={8}>Connected</Text>}
                <TextInput label="Overlay URL" placeholder="https://source.soundalerts.com/overlay/..." value={overlayUrl} onChange={(ev) => update(ev.target.value)} />
            </Fieldset>
        </Stack>
    );
}
