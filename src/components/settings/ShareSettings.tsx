import { TagsInput, Text, Space, TextInput } from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function ShareSettings() {
    const config = useContext(ConfigContext);
    const [shares, setShares] = useState<string[]>(config.shares);
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>("");
    const [pallyggApiKey, setPallyggApiKey] = useState<string>("");
    const [pallyggChannel, setPallyggChannel] = useState<string>("");

    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/get?state="+state).then(res => res.json()).then((data) => {
            setPallyggApiKey(data.apikey || '');
            setPallyggChannel(data.channel || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/get?state="+state).then(res => res.json()).then((data) => {
            setElevenLabsApiKey(data.apikey || '');
        });
    }, []);

    const updatePallyGG = (apikey: string, channel: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/set?state="+state+"&apikey="+apikey+"&channel="+channel);
        setPallyggApiKey(apikey || '');
        setPallyggChannel(channel || '');
    };

    const updateElevenLabs = (apikey: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/set?state="+state+"&apikey="+apikey);
        setElevenLabsApiKey(apikey || '');
    };

    useEffect(() => {
        if (shares != config.shares) {
            config.setShares(shares);
        }
    }, [shares]);

    return (<>
        <Text size="md" fw={700}>Share Alerts with:</Text>
        <TagsInput placeholder="" value={config.shares} onChange={setShares}></TagsInput>
        <Space h="xs" />
        <Text fs="italic">* Share your alerts with other Streams so they can use your sounds. Be aware: If you use AI-TTS shared alerts will count against your Quota from elevenlabs</Text>
        <Space h="lg" />
        <Text size="md" fw={700}>Pally.gg Config</Text>
        <TextInput label="API Key" placeholder="" value={pallyggApiKey} onChange={(ev) => updatePallyGG(ev.target.value, pallyggChannel)} />
        <TextInput label="Pally Slug" placeholder="" value={pallyggChannel} onChange={(ev) => updatePallyGG(pallyggApiKey, ev.target.value)} />
        <Space h="lg" />
        <Text size="md" fw={700}>Elevenlabs Config</Text>
        <TextInput label="API Key" placeholder="" value={elevenLabsApiKey} onChange={(ev) => updateElevenLabs(ev.target.value)} />

    </>
)
}