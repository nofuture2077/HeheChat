import { useContext, useState } from 'react';
import { Group, ActionIcon, Text, Stack, Slider } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipForward, IconVolume, IconMusic } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './MusicPlayerBar.module.css';
import { MusicContext } from '@/ApplicationContext';

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

export function MusicPlayerBar() {
    const music = useContext(MusicContext);
    const track = music.currentTrack;
    const [draggingVolume, setDraggingVolume] = useState<number | null>(null);
    const volume = draggingVolume ?? track?.volumePercent ?? 0;

    return (
        <div className={`glass-panel ${classes.glassCard}`}>
            <Group justify="space-between" gap="sm" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                    <IconMusic size={16} className={classes.noteIcon} />
                    <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate>{track?.name || 'Nothing playing'}</Text>
                        <Text size="xs" c="dimmed" truncate>{track?.artist || ''}</Text>
                    </Stack>
                </Group>

                <Group gap={6} wrap="nowrap">
                    <ActionIcon
                      variant="gradient"
                      className="glass-pink-button"
                      size="md"
                      radius="xl"
                      onClick={() => reportError(track?.isPlaying ? music.pause() : music.play())}
                    >
                        {track?.isPlaying
                            ? <IconPlayerPause size={16} />
                            : <IconPlayerPlay size={16} />}
                    </ActionIcon>
                    <ActionIcon
                      variant="gradient"
                      className="glass-pink-button"
                      size="md"
                      radius="xl"
                      onClick={() => reportError(music.skip())}
                    >
                        <IconPlayerSkipForward size={16} />
                    </ActionIcon>
                </Group>

                <Group gap={4} wrap="nowrap" style={{ width: 90 }}>
                    <IconVolume size={14} />
                    <Slider
                      style={{ flex: 1 }}
                      size="sm"
                      color="pink"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={setDraggingVolume}
                      onChangeEnd={(value) => {
                          setDraggingVolume(null);
                          reportError(music.setVolume(value));
                      }}
                    />
                </Group>
            </Group>
        </div>
    );
}
