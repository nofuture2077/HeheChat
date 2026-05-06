import { useEffect, useState, ReactNode } from 'react';
import { Indicator } from '@mantine/core';
import PubSub from 'pubsub-js';

interface StreamStatsMessage {
    bitrate_kbps: number | null;
}

function bitrateColor(bitrate: number | null): string {
    if (bitrate === null) return 'gray';
    if (bitrate >= 2500) return 'green';
    if (bitrate >= 1000) return 'yellow';
    return 'red';
}

export function BitrateIndicator({ children }: { children: ReactNode }) {
    const [bitrate, setBitrate] = useState<number | null>(null);

    useEffect(() => {
        const sub = PubSub.subscribe('WS-streamStats', (_msg: string, data: StreamStatsMessage) => {
            setBitrate(data.bitrate_kbps);
        });
        return () => { PubSub.unsubscribe(sub); };
    }, []);

    return (
        <Indicator size={8} offset={2} color={bitrateColor(bitrate)} processing={bitrate === null}>
            {children}
        </Indicator>
    );
}
