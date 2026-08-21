import { useContext, useState } from 'react';
import { Fieldset, Stack, Text, Button, Group, Badge } from '@mantine/core';
import { IconBrandSpotify } from '@tabler/icons-react';
import { MusicContext } from '@/ApplicationContext';
import { getSpotifyAuthUrl, spotifyToken } from '@/api/spotify';

export function ConnectSpotifySettings() {
    const music = useContext(MusicContext);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setBusy(true);
        setError(null);
        try {
            const url = await getSpotifyAuthUrl(spotifyToken());
            window.location.href = url;
        } catch {
            setError('Failed to start Spotify authorization.');
            setBusy(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Spotify" variant="filled">
                {music.connected ? (
                    <Stack gap="sm">
                        <Group gap="xs">
                            <Badge color="green" leftSection={<IconBrandSpotify size={12} />}>Connected</Badge>
                        </Group>
                        {error && <Text size="sm" c="red">{error}</Text>}
                        <Group justify="flex-end">
                            <Button variant="light" loading={busy} leftSection={<IconBrandSpotify size={14} />} onClick={handleConnect}>
                                Reconnect
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Stack gap="sm">
                        <Text size="sm" c="dimmed">
                            No Spotify account connected. Connect your Spotify account to enable
                            music controls and song requests.
                        </Text>
                        {error && <Text size="sm" c="red">{error}</Text>}
                        <Group justify="flex-end">
                            <Button
                              loading={busy}
                              leftSection={<IconBrandSpotify size={14} />}
                              onClick={handleConnect}
                            >
                                Connect Spotify
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Fieldset>
        </Stack>
    );
}
