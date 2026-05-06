import { useEffect, useContext } from 'react';
import { notifications } from '@mantine/notifications';
import PubSub from 'pubsub-js';
import { ConfigContext } from '@/ApplicationContext';

interface SceneSwitchMessage {
    from: string;
    to: string;
    reason: string;
    timestamp: string;
}

function reasonLabel(reason: string): string {
    if (reason === 'manual') return 'Manual switch';
    if (reason.startsWith('rule:')) return `Rule ${reason.slice(5)}`;
    return reason;
}

export function SwitcherNotifications() {
    const config = useContext(ConfigContext);

    useEffect(() => {
        const sub = PubSub.subscribe('WS-sceneSwitch', (_msg: string, data: SceneSwitchMessage) => {
            if (!config.showSceneSwitchNotifications) return;
            if (data.reason === 'obs-report') return;

            notifications.show({
                title: 'Scene Switch',
                message: `${data.from} → ${data.to} (${reasonLabel(data.reason)})`,
                color: 'blue',
                autoClose: 5000,
            });
        });

        return () => { PubSub.unsubscribe(sub); };
    }, [config.showSceneSwitchNotifications]);

    return null;
}
