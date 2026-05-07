import { TextInput, Fieldset, Stack, Text, Button, Badge, Group } from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconBrandYoutube } from '@tabler/icons-react';

export function ConnectYouTubeSettings() {
    const [connected, setConnected] = useState(false);
    const [channelId, setChannelId] = useState("");
    const [channelName, setChannelName] = useState("");
    const [loading, setLoading] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/youtube/get?state=${state}`).then(r => r.json());
            if (data.connected) {
                setConnected(true);
                setChannelId(data.channel_id || '');
                setChannelName(data.channel_name || '');
            } else {
                setConnected(false);
                setChannelId('');
                setChannelName('');
            }
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        if (!channelId.trim()) { alert('Please enter a YouTube Channel-ID'); return; }
        setLoading(true);
        try {
            const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/youtube/set-channel?state=${state}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel_id: channelId, channel_name: channelName })
            }).then(r => r.json());
            if (data.success) setConnected(true);
            else alert('Error connecting: ' + (data.error || 'Unknown error'));
        } catch (error) {
            alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your YouTube channel?')) return;
        setLoading(true);
        try {
            const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/youtube/disconnect?state=${state}`, { method: 'DELETE' }).then(r => r.json());
            if (data.success) {
                setConnected(false);
                setChannelId('');
                setChannelName('');
                alert('YouTube connection disconnected');
            } else {
                alert('Error disconnecting: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="YouTube Chat" variant="filled">
                <Text size="sm" mb={10}>
                    Connect your YouTube channel to receive live chat messages from your YouTube streams in HeheChat.
                </Text>

                {loading ? (
                    <Badge color="gray" size="lg" mb="md">Loading...</Badge>
                ) : connected ? (
                    <Stack gap="sm">
                        <Group>
                            <Badge color="green" size="lg" leftSection={<IconBrandYoutube size={16} />}>✅ Connected</Badge>
                        </Group>
                        <Text size="sm" fw={500}><strong>Channel-ID:</strong> {channelId}</Text>
                        {channelName && <Text size="sm" fw={500}><strong>Channel Name:</strong> {channelName}</Text>}
                        <Text size="sm" c="dimmed">💡 When you start a livestream, chat messages will automatically appear in HeheChat.</Text>
                        <Button color="red" variant="light" onClick={disconnect} disabled={loading}>Disconnect YouTube</Button>
                    </Stack>
                ) : (
                    <Stack gap="md">
                        <Text size="sm">Connect your YouTube channel by entering your Channel-ID below.</Text>
                        <TextInput label="YouTube Channel-ID" placeholder="UCxxxxxxxxxxxxxxxxxxxxx" value={channelId} onChange={(ev) => setChannelId(ev.target.value)} description="Your channel ID starts with 'UC'" />
                        <TextInput label="Channel Name (optional)" placeholder="My YouTube Channel" value={channelName} onChange={(ev) => setChannelName(ev.target.value)} />
                        <Button color="red" leftSection={<IconBrandYoutube size={20} />} onClick={save} disabled={!channelId || loading}>
                            {loading ? 'Connecting...' : 'Connect YouTube'}
                        </Button>
                        <details>
                            <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#868e96' }}>How to find your Channel-ID</summary>
                            <ol style={{ marginTop: '10px', fontSize: '14px', color: '#495057' }}>
                                <li>Go to <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer">YouTube Studio</a></li>
                                <li>Click on "Customization" → "Basic info"</li>
                                <li>Your Channel-ID is listed under "Channel URL"</li>
                            </ol>
                        </details>
                    </Stack>
                )}
            </Fieldset>
        </Stack>
    );
}
