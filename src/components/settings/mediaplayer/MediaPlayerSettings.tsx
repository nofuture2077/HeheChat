import { useContext, useEffect, useState } from 'react';
import { Stack, Fieldset, Select, Group, ActionIcon, Text, Slider, Alert } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipForward, IconVolume, IconInfoCircle } from '@tabler/icons-react';
import { MusicContext } from '@/ApplicationContext';
import { getSpotifyPlaylists, SpotifyPlaylist, spotifyToken } from '@/api/spotify';

export function MediaPlayerSettings() {
    const music = useContext(MusicContext);
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);

    useEffect(() => {
        if (!music.connected) return;
        setLoadingPlaylists(true);
        getSpotifyPlaylists(spotifyToken())
            .then(setPlaylists)
            .catch(() => setPlaylists([]))
            .finally(() => setLoadingPlaylists(false));
    }, [music.connected]);

    if (!music.connected) {
        return (
            <Stack mt={30} mb={30} gap={30}>
                <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                    Connect your Spotify account under Connect › Spotify to enable media
                    player controls.
                </Alert>
            </Stack>
        );
    }

    const playlistOptions = playlists.map(p => ({ value: p.uri, label: p.name }));

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Now Playing" variant="filled">
                <Stack gap="sm">
                    <Text size="sm" fw={600}>
                        {music.currentTrack?.name || 'Nothing playing'}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {music.currentTrack?.artist || ''}
                    </Text>
                </Stack>
            </Fieldset>

            <Fieldset legend="Controls" variant="filled">
                <Stack gap="md">
                    <Select
                      label="Playlist"
                      placeholder={loadingPlaylists ? 'Loading playlists...' : 'Select a playlist'}
                      data={playlistOptions}
                      value={music.settings.playlistUri || null}
                      onChange={(value) => {
                            const playlist = playlists.find(p => p.uri === value);
                            music.updateSettings({
                                playlistUri: value || null,
                                playlistName: playlist?.name || null,
                            });
                        }}
                      clearable
                      disabled={loadingPlaylists}
                    />

                    <Group justify="center" gap="md">
                        <ActionIcon
                          size="lg"
                          variant="filled"
                          onClick={() => music.currentTrack?.isPlaying
                              ? music.pause()
                              : music.play(music.settings.playlistUri || undefined)}
                        >
                            {music.currentTrack?.isPlaying
                                ? <IconPlayerPause size={18} />
                                : <IconPlayerPlay size={18} />}
                        </ActionIcon>
                        <ActionIcon size="lg" variant="filled" onClick={() => music.skip()}>
                            <IconPlayerSkipForward size={18} />
                        </ActionIcon>
                    </Group>

                    <Stack gap={4}>
                        <Group gap="xs">
                            <IconVolume size={16} />
                            <Text size="sm">Volume</Text>
                        </Group>
                        <Slider
                          min={0}
                          max={100}
                          value={music.currentTrack?.volumePercent ?? 0}
                          onChange={(value) => music.setVolume(value)}
                          label={(value) => `${value}%`}
                        />
                    </Stack>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
