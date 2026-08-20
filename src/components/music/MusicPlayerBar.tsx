import { useContext } from 'react';
import { Group, ActionIcon, Text, Stack, Slider } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipForward, IconVolume } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './MusicPlayerBar.module.css';
import { MusicContext } from '@/ApplicationContext';

function reportError(promise: Promise<void>) {
    promise.catch((err) => {
        notifications.show({ title: 'Spotify', message: err?.message || 'Something went wrong', color: 'red' });
    });
}

export function MusicPlayerBar() {
    const music = useContext(MusicContext);
    const track = music.currentTrack;

    return (
        <div className={`glass-panel ${classes.glassCard}`}>
            <Group justify="space-between" gap="sm" wrap="nowrap">
                <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={600} truncate>{track?.name || 'Nothing playing'}</Text>
                    <Text size="xs" c="dimmed" truncate>{track?.artist || ''}</Text>
                </Stack>

                <Group gap={4} wrap="nowrap">
                    <ActionIcon
                      variant="filled"
                      size="md"
                      radius="xl"
                      onClick={() => reportError(track?.isPlaying ? music.pause() : music.play())}
                    >
                        {track?.isPlaying
                            ? <IconPlayerPause size={16} />
                            : <IconPlayerPlay size={16} />}
                    </ActionIcon>
                    <ActionIcon variant="filled" size="md" radius="xl" onClick={() => reportError(music.skip())}>
                        <IconPlayerSkipForward size={16} />
                    </ActionIcon>
                </Group>

                <Group gap={4} wrap="nowrap" style={{ width: 90 }}>
                    <IconVolume size={14} />
                    <Slider
                      style={{ flex: 1 }}
                      size="sm"
                      min={0}
                      max={100}
                      value={track?.volumePercent ?? 0}
                      onChange={(value) => reportError(music.setVolume(value))}
                    />
                </Group>
            </Group>
        </div>
    );
}
