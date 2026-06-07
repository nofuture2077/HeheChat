import { TextInput, Fieldset, Stack, Text, Button, Badge, Group, Alert } from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconBrandYoutube, IconInfoCircle } from '@tabler/icons-react';

const CHANNEL_ID_REGEX = /^UC[\w-]{22}$/;

function validateChannelId(id: string): string | null {
    if (!id.trim()) return 'Channel ID is required.';
    if (!CHANNEL_ID_REGEX.test(id.trim())) return 'Channel ID must start with "UC" and be 24 characters long (e.g. UCxxxxxxxxxxxxxxxxxxxxx).';
    return null;
}

export function ConnectYouTubeSettings() {
    const [connected, setConnected] = useState(false);
    const [channelId, setChannelId] = useState("");
    const [channelIdError, setChannelIdError] = useState<string | null>(null);
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
            } else {
                setConnected(false);
                setChannelId('');
            }
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        const error = validateChannelId(channelId);
        if (error) { setChannelIdError(error); return; }
        setChannelIdError(null);
        setLoading(true);
        try {
            const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/youtube/set-channel?state=${state}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel_id: channelId.trim() })
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
                        <Text size="sm" c="dimmed">💡 When you start a livestream, chat messages will automatically appear in HeheChat.</Text>
                        <Button color="red" variant="light" onClick={disconnect} disabled={loading}>Disconnect YouTube</Button>
                    </Stack>
                ) : (
                    <Stack gap="md">
                        <Text size="sm">Connect your YouTube channel by entering your Channel-ID below.</Text>
                        <TextInput
                            label="YouTube Channel-ID"
                            placeholder="UCxxxxxxxxxxxxxxxxxxxxx"
                            value={channelId}
                            onChange={(ev) => { setChannelId(ev.target.value); setChannelIdError(null); }}
                            error={channelIdError}
                            description='24 characters, always starts with "UC"'
                        />
                        <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light" title="Where to find your Channel ID">
                            <Text size="sm" mb={4}>Your Channel ID is a 24-character string starting with <strong>UC</strong>.</Text>
                            <Text size="sm" mb={4}>To find it:</Text>
                            <ol style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '13px' }}>
                                <li>Open <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer">YouTube Studio</a></li>
                                <li>Go to <strong>Customization → Basic info</strong></li>
                                <li>Your Channel ID is shown under <strong>Channel URL</strong> (the part after <code>/channel/</code>)</li>
                            </ol>
                            <Text size="xs" c="dimmed" mt={6}>Alternatively, go to your channel page, click "More" → "Share" → "Copy channel ID".</Text>
                        </Alert>
                        <Button color="red" leftSection={<IconBrandYoutube size={20} />} onClick={save} disabled={loading}>
                            {loading ? 'Connecting...' : 'Connect YouTube'}
                        </Button>
                    </Stack>
                )}
            </Fieldset>
        </Stack>
    );
}
