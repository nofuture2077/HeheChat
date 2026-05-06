import { useEffect, useState, useContext } from 'react';
import { Stack, Text, Group, Button, Badge, Fieldset, Tabs, ScrollArea } from '@mantine/core';
import { IconBroadcast, IconSettings, IconList, IconKey } from '@tabler/icons-react';
import PubSub from 'pubsub-js';
import { getSwitcherStatus, getSwitcherScenes, postSwitcherScene } from '@/api/switcher';
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

function StreamTab({ channel }: { channel: string | undefined }) {
    const [scenes, setScenes] = useState<string[]>([]);
    const [activeScene, setActiveScene] = useState<string | null>(null);
    const [bitrate, setBitrate] = useState<number | null>(null);
    const [rtt, setRtt] = useState<number | null>(null);

    useEffect(() => {
        if (!channel) return;

        Promise.all([
            getSwitcherStatus(channel),
            getSwitcherScenes(channel),
        ]).then(([status, sceneData]) => {
            setActiveScene(status.scene ?? null);
            setBitrate(status.bitrate_kbps ?? null);
            setRtt(status.rtt_ms ?? null);
            setScenes(sceneData.scenes ?? []);
        }).catch(() => {});

        const statsSub = PubSub.subscribe('WS-streamStats', (_: string, data: StreamStatsMessage) => {
            setBitrate(data.bitrate_kbps);
            setRtt(data.rtt_ms);
        });
        const listSub = PubSub.subscribe('WS-sceneList', (_: string, data: { scenes: string[] }) => {
            setScenes(data.scenes ?? []);
        });
        const switchSub = PubSub.subscribe('WS-sceneSwitch', (_: string, data: SceneSwitchMessage) => {
            setActiveScene(data.to);
        });

        return () => {
            PubSub.unsubscribe(statsSub);
            PubSub.unsubscribe(listSub);
            PubSub.unsubscribe(switchSub);
        };
    }, [channel]);

    const handleSceneClick = (scene: string) => {
        if (!channel) return;
        postSwitcherScene(channel, scene).catch(() => {});
        setActiveScene(scene);
    };

    return (
        <Stack mt={16} gap={16} p="md">
            <Fieldset legend="Stream Stats" variant="filled">
                <Group gap="md">
                    <Badge color={bitrateColor(bitrate)} size="lg" variant="filled">
                        {bitrateLabel(bitrate)}
                    </Badge>
                    {rtt !== null && (
                        <Text size="sm" c="dimmed">RTT: {rtt} ms</Text>
                    )}
                </Group>
            </Fieldset>

            <Fieldset legend="Scenes" variant="filled">
                {scenes.length === 0 ? (
                    <Text size="sm" c="dimmed">No OBS client connected</Text>
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
