import { useEffect, useState, useContext, ReactNode } from 'react';
import { Indicator } from '@mantine/core';
import PubSub from 'pubsub-js';
import { ConfigContext } from '@/ApplicationContext';
import { getSwitcherConfig } from '@/api/switcher';

interface StreamStatsMessage {
    bitrate_kbps: number | null;
}

function bitrateColor(bitrate: number | null, yellow = 1000, red = 400): string {
    if (bitrate === null) return 'gray';
    if (bitrate >= yellow) return 'green';
    if (bitrate >= red) return 'yellow';
    return 'red';
}

export function BitrateIndicator({ children }: { children: ReactNode }) {
    const config = useContext(ConfigContext);
    const [bitrate, setBitrate] = useState<number | null>(null);
    const [yellowThreshold, setYellowThreshold] = useState(1000);
    const [redThreshold, setRedThreshold] = useState(400);

    useEffect(() => {
        const channel = config.getChatChannel();
        if (channel) {
            getSwitcherConfig(channel).then(cfg => {
                setYellowThreshold(cfg.yellow_threshold_kbps ?? 1000);
                setRedThreshold(cfg.red_threshold_kbps ?? 400);
            }).catch(() => {});
        }
        const sub = PubSub.subscribe('WS-streamStats', (_msg: string, data: StreamStatsMessage) => {
            setBitrate(data.bitrate_kbps);
        });
        return () => { PubSub.unsubscribe(sub); };
    }, []);

    return (
        <Indicator size={8} offset={2} color={bitrateColor(bitrate, yellowThreshold, redThreshold)} processing={bitrate === null}>
            {children}
        </Indicator>
    );
}
