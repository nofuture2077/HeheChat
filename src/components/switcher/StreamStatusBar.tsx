import { useEffect, useState, useContext } from 'react';
import { Group, Badge } from '@mantine/core';
import PubSub from 'pubsub-js';
import { ConfigContext } from '@/ApplicationContext';

interface StreamStatsMessage {
    bitrate_kbps: number | null;
    rtt_ms: number | null;
    scene: string | null;
}

function bitrateColor(bitrate: number | null): string {
    if (bitrate === null) return 'gray';
    if (bitrate >= 2500) return 'green';
    if (bitrate >= 1000) return 'yellow';
    return 'red';
}

function formatMbit(bitrate: number | null): string {
    if (bitrate === null) return '? Mbit';
    return (bitrate / 1000).toFixed(1) + ' Mbit';
}

export function StreamStatusBar() {
    const config = useContext(ConfigContext);
    const [bitrate, setBitrate] = useState<number | null>(null);
    const [scene, setScene] = useState<string | null>(null);

    useEffect(() => {
        const sub = PubSub.subscribe('WS-streamStats', (_msg: string, data: StreamStatsMessage) => {
            setBitrate(data.bitrate_kbps);
            setScene(data.scene);
        });
        return () => { PubSub.unsubscribe(sub); };
    }, []);

    return (
        <Group gap="xs" justify="center" py={2}>
            <Badge variant="light" color={bitrateColor(bitrate)} size="sm" radius="sm">
                {formatMbit(bitrate)}
            </Badge>
            {config.showSceneName && scene && (
                <Badge variant="light" color="gray" size="sm" radius="sm">
                    {scene}
                </Badge>
            )}
        </Group>
    );
}
