import { useEffect, useState, useContext } from 'react';
import { Group, Badge, Menu } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import PubSub from 'pubsub-js';
import { ConfigContext } from '@/ApplicationContext';
import { getSwitcherScenes, getSwitcherStatus, postSwitcherScene } from '@/api/switcher';

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
    const [scenes, setScenes] = useState<string[]>([]);

    useEffect(() => {
        const channel = config.getChatChannel();
        if (channel) {
            Promise.all([getSwitcherStatus(channel), getSwitcherScenes(channel)]).then(([status, sceneData]) => {
                setScene(status.scene ?? null);
                setBitrate(status.bitrate_kbps ?? null);
                setScenes(sceneData.scenes ?? []);
            }).catch(() => {});
        }

        const statsSub = PubSub.subscribe('WS-streamStats', (_msg: string, data: StreamStatsMessage) => {
            setBitrate(data.bitrate_kbps);
            setScene(data.scene);
            setScenes(prev => {
                if (prev.length === 0 && channel) {
                    getSwitcherScenes(channel).then(d => setScenes(d.scenes ?? [])).catch(() => {});
                }
                return prev;
            });
        });
        const listSub = PubSub.subscribe('WS-sceneList', (_msg: string, data: { scenes: string[] }) => {
            setScenes(data.scenes ?? []);
        });
        const switchSub = PubSub.subscribe('WS-sceneSwitch', (_msg: string, data: { to: string }) => {
            setScene(data.to);
        });
        return () => {
            PubSub.unsubscribe(statsSub);
            PubSub.unsubscribe(listSub);
            PubSub.unsubscribe(switchSub);
        };
    }, []);

    const handleSceneSwitch = (sceneName: string) => {
        const channel = config.getChatChannel();
        if (!channel) return;
        postSwitcherScene(channel, sceneName).catch(() => {});
        setScene(sceneName);
    };

    return (
        <Group align="stretch" gap="xs">
            <Badge color={bitrateColor(bitrate)} size="sm" radius="sm">
                {formatMbit(bitrate)}
            </Badge>
            {config.showSceneName && scene && (
                <Menu shadow="md" position="bottom-end" onOpen={() => {
                    const channel = config.getChatChannel();
                    if (scenes.length === 0 && channel) {
                        getSwitcherScenes(channel).then(d => setScenes(d.scenes ?? [])).catch(() => {});
                    }
                }}>
                    <Menu.Target>
                        <Badge color="gray" size="sm" radius="sm" style={{ cursor: 'pointer' }}>
                            {scene}
                        </Badge>
                    </Menu.Target>
                    <Menu.Dropdown>
                        {scenes.map((s) => (
                            <Menu.Item
                                key={s}
                                onClick={() => handleSceneSwitch(s)}
                                rightSection={s === scene ? <IconCheck size={12} /> : null}
                            >
                                {s}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            )}
        </Group>
    );
}
