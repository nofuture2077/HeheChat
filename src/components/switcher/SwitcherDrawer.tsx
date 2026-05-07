import { useEffect, useState, useContext } from 'react';
import { Stack, Text, Group, Button, Badge, Fieldset, Tabs, ScrollArea } from '@mantine/core';
import { IconBroadcast, IconSettings, IconList, IconKey } from '@tabler/icons-react';
import PubSub from 'pubsub-js';
import { getSwitcherStatus, getSwitcherScenes, postSwitcherScene, getStreamStatus, postStreamStart, postStreamStop } from '@/api/switcher';
import { ConfigContext, PremiumContext } from '@/ApplicationContext';
import { OverlayDrawer } from '@/pages/Chat.page';
import { ProviderConfigTab } from './ProviderConfigTab';
import { RulesTab } from './RulesTab';
import { TokenTab } from './TokenTab';
import { PremiumRequired } from './PremiumRequired';

interface StreamStatsMessage {
    bitrate_kbps: number | null;
    rtt_ms: number | null;
    scene: string;
}

interface SceneSwitchMessage {
    from: string;
    to: string;
    reason: string;
    timestamp: string;
}

function bitrateColor(bitrate: number | null): string {
    if (bitrate === null) return 'gray';
    if (bitrate >= 2500) return 'green';
    if (bitrate >= 1000) return 'yellow';
    return 'red';
}

function bitrateLabel(bitrate: number | null): string {
    if (bitrate === null) return 'No data';
    return `${bitrate.toLocaleString()} kbps`;
}

interface StreamStatusMessage {
    outputActive: boolean;
}

function StreamTab({ channel }: { channel: string | undefined }) {
    const [scenes, setScenes] = useState<string[]>([]);
    const [activeScene, setActiveScene] = useState<string | null>(null);
    const [bitrate, setBitrate] = useState<number | null>(null);
    const [rtt, setRtt] = useState<number | null>(null);
    const [isLive, setIsLive] = useState<boolean>(false);

    useEffect(() => {
        if (!channel) return;

        Promise.all([
            getSwitcherStatus(channel),
            getSwitcherScenes(channel),
            getStreamStatus(channel),
        ]).then(([status, sceneData, streamStatus]) => {
            setActiveScene(status.scene ?? null);
            setBitrate(status.bitrate_kbps ?? null);
            setRtt(status.rtt_ms ?? null);
            setScenes(sceneData.scenes ?? []);
            setIsLive(streamStatus.outputActive ?? false);
        }).catch(() => {});

        const statsSub = PubSub.subscribe('WS-streamStats', (_: string, data: StreamStatsMessage) => {
            setBitrate(data.bitrate_kbps);
            setRtt(data.rtt_ms);
            setScenes(prev => {
                if (prev.length === 0 && channel) {
                    getSwitcherScenes(channel).then(d => setScenes(d.scenes ?? [])).catch(() => {});
                }
                return prev;
            });
        });
        const listSub = PubSub.subscribe('WS-sceneList', (_: string, data: { scenes: string[] }) => {
            setScenes(data.scenes ?? []);
        });
        const switchSub = PubSub.subscribe('WS-sceneSwitch', (_: string, data: SceneSwitchMessage) => {
            setActiveScene(data.to);
        });
        const streamStatusSub = PubSub.subscribe('WS-streamStatus', (_: string, data: StreamStatusMessage) => {
            setIsLive(data.outputActive);
        });

        return () => {
            PubSub.unsubscribe(statsSub);
            PubSub.unsubscribe(listSub);
            PubSub.unsubscribe(switchSub);
            PubSub.unsubscribe(streamStatusSub);
        };
    }, [channel]);

    const handleSceneClick = (scene: string) => {
        if (!channel) return;
        postSwitcherScene(channel, scene).catch(() => {});
        setActiveScene(scene);
    };

    const handleStreamToggle = () => {
        if (!channel) return;
        if (isLive) {
            postStreamStop(channel).catch(() => {});
        } else {
            postStreamStart(channel).catch(() => {});
        }
    };

    return (
        <Stack mt={16} gap={16} p="md">
            <Fieldset legend="Stream Stats" variant="filled">
                <Group gap="md" justify="space-between">
                    <Group gap="md">
                        <Badge color={bitrateColor(bitrate)} size="lg" variant="filled">
                            {bitrateLabel(bitrate)}
                        </Badge>
                        <Badge color={isLive ? 'green' : 'gray'} size="lg" variant="filled">
                            {isLive ? 'LIVE' : 'OFFLINE'}
                        </Badge>
                        {rtt !== null && (
                            <Text size="sm" c="dimmed">RTT: {rtt} ms</Text>
                        )}
                    </Group>
                    <Button size="xs" color={isLive ? 'red' : 'green'} onClick={handleStreamToggle}>
                        {isLive ? 'Stop Stream' : 'Start Stream'}
                    </Button>
                </Group>
            </Fieldset>

            <Fieldset legend="Scenes" variant="filled">
                {scenes.length === 0 ? (
                    <Group gap="xs">
                        <Text size="sm" c="dimmed">No OBS client connected</Text>
                        <Button size="xs" variant="subtle" onClick={() => {
                            if (channel) getSwitcherScenes(channel).then(d => setScenes(d.scenes ?? [])).catch(() => {});
                        }}>Retry</Button>
                    </Group>
                ) : (
                    <Group gap="xs" wrap="wrap">
                        {scenes.map(scene => (
                            <Button
                                key={scene}
                                size="sm"
                                variant={scene === activeScene ? 'filled' : 'outline'}
                                onClick={() => handleSceneClick(scene)}
                            >
                                {scene}
                            </Button>
                        ))}
                    </Group>
                )}
            </Fieldset>
        </Stack>
    );
}

function SwitcherDrawerView() {
    const config = useContext(ConfigContext);
    const premium = useContext(PremiumContext);
    const channel = config.getChatChannel();

    return (
        <Tabs defaultValue="stream">
            <Tabs.List>
                <Tabs.Tab value="stream" leftSection={<IconBroadcast size={14} />}>Stream</Tabs.Tab>
                <Tabs.Tab value="provider" leftSection={<IconSettings size={14} />}>Provider</Tabs.Tab>
                <Tabs.Tab value="rules" leftSection={<IconList size={14} />}>Rules</Tabs.Tab>
                <Tabs.Tab value="token" leftSection={<IconKey size={14} />}>Token</Tabs.Tab>
            </Tabs.List>

            <ScrollArea h="calc(100vh - 80px)">
                <Tabs.Panel value="stream">
                    <StreamTab channel={channel} />
                </Tabs.Panel>
                <Tabs.Panel value="provider">
                    {premium.isPremium ? <ProviderConfigTab /> : <PremiumRequired />}
                </Tabs.Panel>
                <Tabs.Panel value="rules">
                    {premium.isPremium ? <RulesTab /> : <PremiumRequired />}
                </Tabs.Panel>
                <Tabs.Panel value="token">
                    {premium.isPremium ? <TokenTab /> : <PremiumRequired />}
                </Tabs.Panel>
            </ScrollArea>
        </Tabs>
    );
}

export const SwitcherDrawer: OverlayDrawer = {
    name: 'switcher',
    component: SwitcherDrawerView,
    position: 'right',
    size: 480,
};
