import { useCallback, useContext, useEffect, useState } from 'react';
import { Stack, Fieldset, Select, Group, ActionIcon, Text, Slider, Alert, Switch } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipForward, IconVolume, IconInfoCircle, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { MusicContext, ConfigContext } from '@/ApplicationContext';
import { getSpotifyDevices, getSpotifyPlaylists, selectSpotifyDevice, SpotifyDevice, SpotifyPlaylist, spotifyToken } from '@/api/spotify';

function reportError(promise: Promise<void>) {
    promise.catch((err) => {
        notifications.show({
            id: 'spotify-error',
            title: 'Spotify',
            message: err?.message || 'Something went wrong',
            color: 'pink',
        });
    });
}

export function MediaPlayerSettings() {
    const music = useContext(MusicContext);
    const config = useContext(ConfigContext);
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [draggingVolume, setDraggingVolume] = useState<number | null>(null);
    const [devices, setDevices] = useState<SpotifyDevice[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    const refreshDevices = useCallback(() => {
        setLoadingDevices(true);
        getSpotifyDevices(spotifyToken())
            .then(setDevices)
            .catch(() => setDevices([]))
            .finally(() => setLoadingDevices(false));
    }, []);

    useEffect(() => {
        if (!music.connected) return;
        setLoadingPlaylists(true);
        getSpotifyPlaylists(spotifyToken())
            .then(setPlaylists)
            .catch(() => setPlaylists([]))
            .finally(() => setLoadingPlaylists(false));
        refreshDevices();
    }, [music.connected, refreshDevices]);

    const enabledToggle = (
        <Switch
          label="Enable media player"
          description="Show the media player toggle in the header and the media player itself"
          checked={config.mediaPlayerEnabled}
          onChange={(event) => config.setMediaPlayerEnabled(event.currentTarget.checked)}
        />
    );

    if (!music.connected) {
        return (
            <Stack mt={30} mb={30} gap={30}>
                {enabledToggle}
                <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                    Connect your Spotify account under Connect › Spotify to enable media
                    player controls.
                </Alert>
            </Stack>
        );
    }

    const changeDevice = (deviceId: string) => {
        reportError(selectSpotifyDevice(spotifyToken(), deviceId).then(refreshDevices));
    };

    const playlistOptions = playlists.map(p => ({ value: p.uri, label: p.name }));
    const deviceOptions = devices.map(d => ({ value: d.id, label: d.isActive ? `${d.name} (active)` : d.name }));
    const activeDeviceId = devices.find(d => d.isActive)?.id || null;

    return (
        <Stack mt={30} mb={30} gap={30}>
            {enabledToggle}
            <Fieldset legend="Now Playing" variant="filled" className="glass-surface">
                <Stack gap="sm">
                    <Text size="sm" fw={600} c="pink">
                        {music.currentTrack?.name || 'Nothing playing'}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {music.currentTrack?.artist || ''}
                    </Text>
                </Stack>
            </Fieldset>

            <Fieldset legend="Controls" variant="filled" className="glass-surface">
                <Stack gap="md">
                    <Group align="flex-end" gap="xs">
                        <Select
                          label="Device"
                          placeholder={loadingDevices ? 'Loading devices...' : 'Select a device'}
                          data={deviceOptions}
                          value={activeDeviceId}
                          onChange={(value) => value && changeDevice(value)}
                          disabled={loadingDevices}
                          style={{ flex: 1 }}
                        />
                        <ActionIcon
                          size="lg"
                          variant="default"
                          onClick={refreshDevices}
                          disabled={loadingDevices}
                        >
                            <IconRefresh size={18} />
                        </ActionIcon>
                    </Group>

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
                          variant="gradient"
                          radius="xl"
                          onClick={() => reportError(music.currentTrack?.isPlaying
                              ? music.pause()
                              : music.play(music.settings.playlistUri || undefined))}
                        >
                            {music.currentTrack?.isPlaying
                                ? <IconPlayerPause size={18} />
                                : <IconPlayerPlay size={18} />}
                        </ActionIcon>
                        <ActionIcon
                          size="lg"
                          variant="gradient"
                          radius="xl"
                          onClick={() => reportError(music.skip())}
                        >
                            <IconPlayerSkipForward size={18} />
                        </ActionIcon>
                    </Group>

                    <Stack gap={4}>
                        <Group gap="xs">
                            <IconVolume size={16} />
                            <Text size="sm">Volume</Text>
                        </Group>
                        <Slider
                          color="pink"
                          min={0}
                          max={100}
                          value={draggingVolume ?? music.currentTrack?.volumePercent ?? 0}
                          onChange={setDraggingVolume}
                          onChangeEnd={(value) => {
                              setDraggingVolume(null);
                              reportError(music.setVolume(value));
                          }}
                          label={(value) => `${value}%`}
                        />
                    </Stack>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
