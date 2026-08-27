import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Stack, Select, Group, ActionIcon, Switch, Alert } from '@mantine/core';
import { IconInfoCircle, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { MusicContext, ConfigContext } from '@/ApplicationContext';
import { getSpotifyDevices, selectSpotifyDevice, SpotifyDevice, spotifyToken } from '@/api/spotify';

const LAST_DEVICE_KEY = 'hehe-spotify-lastDeviceId';

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

export function MediaPlayerTopSection() {
    const music = useContext(MusicContext);
    const config = useContext(ConfigContext);
    const [devices, setDevices] = useState<SpotifyDevice[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const autoActivated = useRef(false);

    const activateDevice = useCallback((deviceId: string) => {
        localStorage.setItem(LAST_DEVICE_KEY, deviceId);
        return selectSpotifyDevice(spotifyToken(), deviceId);
    }, []);

    const refreshDevices = useCallback(() => {
        setLoadingDevices(true);
        getSpotifyDevices(spotifyToken())
            .then((fetched) => {
                setDevices(fetched);
                if (!autoActivated.current && !fetched.some(d => d.isActive)) {
                    const lastDeviceId = localStorage.getItem(LAST_DEVICE_KEY);
                    if (lastDeviceId && fetched.some(d => d.id === lastDeviceId)) {
                        autoActivated.current = true;
                        reportError(activateDevice(lastDeviceId).then(() => refreshDevices()));
                    }
                }
            })
            .catch(() => setDevices([]))
            .finally(() => setLoadingDevices(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activateDevice]);

    const changeDevice = (deviceId: string) => {
        reportError(activateDevice(deviceId).then(() => refreshDevices()));
    };

    useEffect(() => {
        if (!music.connected) return;
        refreshDevices();
    }, [music.connected, refreshDevices]);

    if (!music.connected) {
        return (
            <Stack gap={30}>
                <Switch
                  label="Enable media player"
                  description="Show the media player toggle in the header and the media player itself"
                  checked={config.mediaPlayerEnabled}
                  onChange={(event) => config.setMediaPlayerEnabled(event.currentTarget.checked)}
                />
                <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                    Connect your Spotify account under Connect › Spotify to enable media
                    player controls.
                </Alert>
            </Stack>
        );
    }

    const deviceOptions = devices.map(d => ({ value: d.id, label: d.isActive ? `${d.name} (active)` : d.name }));
    const activeDeviceId = devices.find(d => d.isActive)?.id || null;

    return (
        <Stack gap={30}>
            <Switch
              label="Enable media player"
              description="Show the media player toggle in the header and the media player itself"
              checked={config.mediaPlayerEnabled}
              onChange={(event) => config.setMediaPlayerEnabled(event.currentTarget.checked)}
            />
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
        </Stack>
    );
}
