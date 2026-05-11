import { useEffect, useState, useContext } from 'react';
import { Group, Badge, Menu, Box } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import PubSub from 'pubsub-js';
import { ConfigContext } from '@/ApplicationContext';
import { getSwitcherScenes, getSwitcherStatus, postSwitcherScene, getStreamStatus, getSwitcherConfig } from '@/api/switcher';

interface StreamStatsMessage {
    bitrate_kbps: number | null;
    rtt_ms: number | null;
    scene: string | null;
    isLive: boolean;
}

function bitrateColor(bitrate: number | null, yellow = 1000, red = 400): string {
    if (bitrate === null) return 'gray';
    if (bitrate >= yellow) return 'green';
    if (bitrate >= red) return 'yellow';
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
    const [isLive, setIsLive] = useState<boolean>(false);
    const [yellowThreshold, setYellowThreshold] = useState(1000);
    const [redThreshold, setRedThreshold] = useState(400);

    useEffect(() => {
        const channel = config.getChatChannel();
        if (channel) {
            getSwitcherConfig(channel).then(cfg => {
                setYellowThreshold(cfg.yellow_threshold_kbps ?? 1000);
                setRedThreshold(cfg.red_threshold_kbps ?? 400);
            }).catch(() => {});
            Promise.all([getSwitcherStatus(channel), getSwitcherScenes(channel), getStreamStatus(channel)]).then(([status, sceneData, streamStatus]) => {
                setScene(status.scene ?? null);
                setBitrate(status.bitrate_kbps ?? null);
                setScenes(sceneData.scenes ?? []);
                setIsLive(streamStatus.outputActive ?? false);
            }).catch(() => {});
        }

        const streamStatusSub = PubSub.subscribe('WS-streamStatus', (_msg: string, data: { outputActive: boolean }) => {
            setIsLive(data.outputActive);
        });

        const statsSub = PubSub.subscribe('WS-streamStats', (_msg: string, data: StreamStatsMessage) => {
            setBitrate(data.bitrate_kbps);
            setScene(data.scene);
            setIsLive(data.isLive);
            setScenes(prev => {
                if (prev.length === 0 && channel) {
                    getSwitcherScenes(channel).then(d => setScenes(d.scenes ?? [])).catch(() => {});
                }
                return prev;
            });
        });
        const listSub = PubSub.subscribe('WS-sceneList', (_msg: string, data: { scenes: string[]; isLive: boolean }) => {
            setScenes(data.scenes ?? []);
            setIsLive(data.isLive);
        });
        const switchSub = PubSub.subscribe('WS-sceneSwitch', (_msg: string, data: { to: string; isLive: boolean }) => {
            setScene(data.to);
            setIsLive(data.isLive);
        });
        return () => {
            PubSub.unsubscribe(streamStatusSub);
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
        <Box
            px="md"
            py={6}
            style={{
                background: 'var(--mantine-color-body)',
                borderRadius: '0 0 var(--mantine-radius-md) var(--mantine-radius-md)',
                display: 'inline-flex',
                border: '1px solid var(--mantine-color-default-border)',
                borderTop: 'none',
            }}
        >
            <Group align="center" gap="xs">
                <Box
                    w={8}
                    h={8}
                    style={{
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: isLive ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-red-6)',
                    }}
                />
                <Badge color={bitrateColor(bitrate, yellowThreshold, redThreshold)} size="md" radius="sm">
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
                            <Badge color="gray" size="md" radius="sm" style={{ cursor: 'pointer' }}>
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
        </Box>
    );
}
