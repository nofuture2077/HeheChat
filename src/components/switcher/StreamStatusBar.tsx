import { useEffect, useState, useContext, useCallback } from 'react';
import { Group, Badge, Menu, Box, Slider, Popover, SegmentedControl, Stack, Text, useComputedColorScheme } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import PubSub from 'pubsub-js';
import { ConfigContext, PremiumContext } from '@/ApplicationContext';
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

interface MoblinScene {
    id: string;
    name: string;
    type?: string;
}

interface MoblinZoomPreset {
    id: string;
    name: string;
}

const FALLBACK_ZOOM_LEVELS = [
    { id: '0.5', name: '0.5×', x: 0.5 },
    { id: '1', name: '1×', x: 1 },
    { id: '2', name: '2×', x: 2 },
    { id: '4', name: '4×', x: 4 },
];

interface MoblinControlProps {
    scenes: MoblinScene[];
    activeSceneId: string | null;
    onSceneSwitch: (id: string) => void;
    zoom: number;
    zoomPresets: MoblinZoomPreset[];
    activePreset: string | null;
    zoomAllowed: boolean;
    onZoom: (x: number) => void;
    onZoomLevel: (id: string, x: number | null) => void;
}

function MoblinControl({ scenes, activeSceneId, onSceneSwitch, zoom, zoomPresets, activePreset, zoomAllowed, onZoom, onZoomLevel }: MoblinControlProps) {
    const usingPresets = zoomPresets.length > 0;
    const levels = usingPresets
        ? zoomPresets.map(p => ({ value: p.id, label: p.name }))
        : FALLBACK_ZOOM_LEVELS.map(l => ({ value: l.id, label: l.name }));

    const handleLevel = (id: string) => {
        if (usingPresets) {
            onZoomLevel(id, null);
        } else {
            const level = FALLBACK_ZOOM_LEVELS.find(l => l.id === id);
            if (level) onZoomLevel(id, level.x);
        }
    };

    return (
        <Stack gap="xs" p="xs" w={220}>
            {scenes.length > 0 && (
                <>
                    <Text size="xs" c="dimmed">Scenes</Text>
                    <SegmentedControl
                        size="xs"
                        value={activeSceneId ?? ''}
                        onChange={onSceneSwitch}
                        data={scenes.map(s => ({ value: s.id, label: s.name }))}
                    />
                </>
            )}
            {zoomAllowed && (
                <>
                    <Text size="xs" c="dimmed">{usingPresets ? 'Presets' : 'Stufen'}</Text>
                    <SegmentedControl
                        size="xs"
                        value={activePreset ?? ''}
                        onChange={handleLevel}
                        data={levels}
                    />
                    <Text size="xs" c="dimmed">Zoom</Text>
                    <Group gap="xs" align="center">
                        <Text size="xs" w={28}>0.5×</Text>
                        <Slider
                            flex={1}
                            min={0.5}
                            max={10}
                            step={0.1}
                            value={zoom}
                            onChange={onZoom}
                            size="sm"
                            label={(v) => `${v.toFixed(1)}×`}
                        />
                        <Text size="xs" w={28}>10×</Text>
                    </Group>
                </>
            )}
        </Stack>
    );
}

export function StreamStatusBar() {
    const config = useContext(ConfigContext);
    const premium = useContext(PremiumContext);
    const colorScheme = useComputedColorScheme('dark');
    const isDark = colorScheme === 'dark';
    const bg = isDark
        ? 'linear-gradient(to bottom, #171317 0%, #141114 100%)'
        : 'linear-gradient(to bottom, rgba(180,80,160,0.04) 0%, rgba(180,80,160,0.02) 100%), var(--mantine-color-gray-0)';
    const [bitrate, setBitrate] = useState<number | null>(null);
    const [scene, setScene] = useState<string | null>(null);
    const [scenes, setScenes] = useState<string[]>([]);
    const [isLive, setIsLive] = useState<boolean>(false);
    const [yellowThreshold, setYellowThreshold] = useState(1000);
    const [redThreshold, setRedThreshold] = useState(400);
    const [moblinConnected, setMoblinConnected] = useState(false);
    const [moblinScenes, setMoblinScenes] = useState<MoblinScene[]>([]);
    const [moblinZoom, setMoblinZoom] = useState(1.0);
    const [moblinZoomPresets, setMoblinZoomPresets] = useState<MoblinZoomPreset[]>([]);
    const [moblinActivePreset, setMoblinActivePreset] = useState<string | null>(null);
    const [moblinActiveSceneId, setMoblinActiveSceneId] = useState<string | null>(null);

    const moblinState = localStorage.getItem('hehe-token_state') || '';

    const refreshMoblinStatus = useCallback(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/get?state=' + moblinState)
            .then(res => res.json())
            .then(data => {
                setMoblinConnected(!!data.connected);
                setMoblinScenes(data.scenes || []);
                setMoblinZoomPresets(data.zoomPresets || []);
                if (data.zoom != null) setMoblinZoom(data.zoom);
                setMoblinActivePreset(data.zoomPreset ?? null);
                if (data.scene != null) setMoblinActiveSceneId(data.scene);
            })
            .catch(() => {});
    }, [moblinState]);

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

        refreshMoblinStatus();
        const moblinInterval = setInterval(refreshMoblinStatus, 30000);

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
            clearInterval(moblinInterval);
        };
    }, [refreshMoblinStatus]);

    const handleMoblinSceneSwitch = (sceneId: string) => {
        setMoblinActiveSceneId(sceneId);
        fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/setscene?state=' + moblinState + '&id=' + encodeURIComponent(sceneId)).catch(() => {});
    };

    const moblinActiveScene = moblinScenes.find(s => s.id === moblinActiveSceneId) ?? null;
    // ponytail: backend doesn't send scene type yet, so this only hides zoom once it does
    const moblinZoomAllowed = moblinActiveScene?.type == null || moblinActiveScene.type === 'cam';

    const handleMoblinZoom = (x: number) => {
        setMoblinZoom(x);
        setMoblinActivePreset(null);
        fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/setzoom?state=' + moblinState + '&x=' + x).catch(() => {});
    };

    const handleMoblinZoomLevel = (id: string, x: number | null) => {
        setMoblinActivePreset(id);
        if (x !== null) {
            setMoblinZoom(x);
            fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/setzoom?state=' + moblinState + '&x=' + x).catch(() => {});
        } else {
            fetch(import.meta.env.VITE_BACKEND_URL + '/moblin/setzoompreset?state=' + moblinState + '&id=' + encodeURIComponent(id)).catch(() => {});
        }
    };

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
                background: bg,
                borderRadius: '0 0 var(--mantine-radius-md) var(--mantine-radius-md)',
                display: 'inline-flex',
                border: '1px solid light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08))',
                borderTop: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
                {premium.isPremium && config.showMoblinZoom && moblinConnected && (
                    <Popover position="bottom-end" shadow="md" withArrow onOpen={refreshMoblinStatus}>
                        <Popover.Target>
                            <Badge color="pink" size="md" radius="sm" style={{ cursor: 'pointer' }}>
                                {moblinActiveScene?.name ?? 'Moblin'}
                            </Badge>
                        </Popover.Target>
                        <Popover.Dropdown p={0}>
                            <MoblinControl
                                scenes={moblinScenes}
                                activeSceneId={moblinActiveSceneId}
                                onSceneSwitch={handleMoblinSceneSwitch}
                                zoom={moblinZoom}
                                zoomPresets={moblinZoomPresets}
                                activePreset={moblinActivePreset}
                                zoomAllowed={moblinZoomAllowed}
                                onZoom={handleMoblinZoom}
                                onZoomLevel={handleMoblinZoomLevel}
                            />
                        </Popover.Dropdown>
                    </Popover>
                )}
            </Group>
        </Box>
    );
}
