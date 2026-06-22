import { Stack, Card, Text, Group, Badge, ActionIcon, Alert, Tooltip, Modal, Button, Grid } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';

// Import SVG logo assets directly
import seventvLogo from '@/res/7tv_logo.svg';
import streamelementLogo from '@/res/streamelement_logo.svg';
import blerpLogo from '@/res/blerp_logo.svg';
import soundalertsLogo from '@/res/soundalerts_logo.svg';
import pallyggLogo from '@/res/pally_logo.svg';
import youtubeLogo from '@/res/youtube_logo.svg';
import elevenlabsLogo from '@/res/elevenlabs_logo.svg';
import kofiLogo from '@/res/kofi_logo.svg';

const LOGOS: Record<string, string> = {
    sevenTV: seventvLogo,
    streamelements: streamelementLogo,
    blerp: blerpLogo,
    soundalerts: soundalertsLogo,
    pallygg: pallyggLogo,
    youtube: youtubeLogo,
    elevenlabs: elevenlabsLogo,
    kofi: kofiLogo,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface ServiceStatus {
    connected: boolean;
    channelname: string;
}

interface ConnectionStatus {
    sevenTV?: ServiceStatus;
    streamelements?: ServiceStatus;
    blerp?: ServiceStatus;
    soundalerts?: ServiceStatus;
    pallygg?: ServiceStatus;
    youtube?: ServiceStatus;
    elevenlabs?: ServiceStatus;
    kofi?: ServiceStatus;
}

interface Connection {
    guid: string;
    connectionStatus: ConnectionStatus;
}

type ServiceKey = keyof ConnectionStatus;

const SERVICES: { key: ServiceKey; label: string; color: string; apiKey: string; canReinit: boolean }[] = [
    { key: 'sevenTV', label: '7TV', color: 'blue', apiKey: 'seventv', canReinit: true },
    { key: 'streamelements', label: 'StreamElements', color: 'teal', apiKey: 'streamelements', canReinit: true },
    { key: 'blerp', label: 'Blerp', color: 'orange', apiKey: 'blerp', canReinit: true },
    { key: 'soundalerts', label: 'SoundAlerts', color: 'violet', apiKey: 'soundalerts', canReinit: true },
    { key: 'pallygg', label: 'Pally.gg', color: 'grape', apiKey: 'pallygg', canReinit: true },
    { key: 'youtube', label: 'YouTube', color: 'red', apiKey: 'youtube', canReinit: false },
    { key: 'elevenlabs', label: 'ElevenLabs', color: 'blue', apiKey: 'elevenlabs', canReinit: false },
    { key: 'kofi', label: 'Ko-fi', color: 'blue', apiKey: 'kofi', canReinit: false },
];

function serviceState(status: ServiceStatus | undefined): 'active' | 'configured' | 'unconfigured' {
    if (!status) return 'unconfigured';
    if (status.connected) return 'active';
    return 'configured';
}

export function ConnectStatusSettings() {
    const token = localStorage.getItem('hehe-token_state') || '';
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reinitializing, setReinitializing] = useState<Record<string, boolean>>({});
    const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
    const [reinitAllLoading, setReinitAllLoading] = useState(false);

    const fetchConnections = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/api/connection?token=${token}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setConnections(data.connections || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch connections');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConnections(); }, []);

    // Merge connectionStatus across all active connections (services are user-level)
    const mergedStatus: ConnectionStatus = {};
    for (const conn of connections) {
        for (const svc of SERVICES) {
            const s = conn.connectionStatus?.[svc.key];
            if (s && (s.connected || !mergedStatus[svc.key])) {
                mergedStatus[svc.key] = s;
            }
        }
    }

    const reinitialize = async (apiKey: string, label: string) => {
        setReinitializing(prev => ({ ...prev, [apiKey]: true }));
        try {
            const res = await fetch(`${BASE_URL}/api/reconnect?token=${token}&service=${apiKey}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                notifications.show({ message: `${label} reinitialized`, color: 'green' });
                await fetchConnections();
            } else {
                notifications.show({ message: `Failed to reinitialize ${label}`, color: 'red' });
            }
        } catch {
            notifications.show({ message: `Error reinitializing ${label}`, color: 'red' });
        } finally {
            setReinitializing(prev => ({ ...prev, [apiKey]: false }));
        }
    };

    const reinitializeAll = async () => {
        closeConfirm();
        setReinitAllLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/reconnect?token=${token}&service=all`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                notifications.show({ message: 'All services reinitialized', color: 'green' });
                await fetchConnections();
            } else {
                notifications.show({ message: 'Failed to reinitialize services', color: 'red' });
            }
        } catch {
            notifications.show({ message: 'Error reinitializing services', color: 'red' });
        } finally {
            setReinitAllLoading(false);
        }
    };

    const noConnection = connections.length === 0 && !loading && !error;

    return (
        <>
            <style>{`
                .monochrome-logo {
                    filter: brightness(0) opacity(0.65);
                    transition: all 0.2s ease;
                }
                :root[data-mantine-color-scheme="dark"] .monochrome-logo,
                [data-mantine-color-scheme="dark"] .monochrome-logo {
                    filter: brightness(0) invert(1) opacity(0.85);
                }
            `}</style>
            <Modal
                opened={confirmOpened}
                onClose={closeConfirm}
                title="Reinitialize All Services"
                centered
                size="sm"
                zIndex={1000}
            >
                <Text size="sm" mb="lg">
                    This will reconnect all configured services. Ongoing events may be interrupted briefly. Continue?
                </Text>
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeConfirm}>Cancel</Button>
                    <Button color="red" onClick={reinitializeAll}>Reinitialize All</Button>
                </Group>
            </Modal>

            <Stack mt={30} mb={30} gap={16}>
                <Group justify="space-between" align="center">
                    <Text fw={600} size="lg">Service Status</Text>
                    <Tooltip label="Refresh">
                        <ActionIcon variant="subtle" onClick={fetchConnections} loading={loading}>
                            <IconRefresh size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {error && <Alert color="red" icon={<IconAlertCircle />}>{error}</Alert>}

                <Grid>
                    {SERVICES.map(({ key, label, color, apiKey, canReinit }) => {
                        const status = mergedStatus[key];
                        const state = noConnection ? 'unconfigured' : serviceState(status);
                        const badgeColor = state === 'active' ? color : state === 'configured' ? 'yellow' : 'gray';
                        const stateLabel = state === 'active' ? 'Active' : state === 'configured' ? 'Configured (Idle)' : 'Not configured';

                        return (
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Card key={key} withBorder padding="sm" radius="md">
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="sm" wrap="nowrap">
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '8px',
                                                    backgroundColor: 'var(--mantine-color-default-hover)',
                                                    border: '1px solid var(--mantine-color-default-border)',
                                                }}
                                            >
                                                <img 
                                                    src={LOGOS[key]} 
                                                    alt={label} 
                                                    className="monochrome-logo"
                                                    style={{ 
                                                        width: 24, 
                                                        height: 24,
                                                        objectFit: 'contain',
                                                        opacity: state === 'active' ? 1 : 0.35,
                                                    }} 
                                                />
                                            </div>
                                            <Stack gap={4}>
                                                <Text fw={600} size="sm">{label}</Text>
                                                <Badge size="xs" color={badgeColor} variant={state === 'active' ? 'filled' : 'light'}>
                                                    {stateLabel}
                                                </Badge>
                                                {status?.channelname ? (
                                                    <Text size="xs" c="dimmed">{status.channelname}</Text>
                                                ) : <Text size="xs" c="dimmed">&nbsp;</Text>}
                                            </Stack>
                                        </Group>
                                        {state !== 'unconfigured' && canReinit && (
                                            <Tooltip label={`Reinitialize ${label}`}>
                                                <ActionIcon
                                                    variant="subtle"
                                                    color={color}
                                                    loading={reinitializing[apiKey]}
                                                    onClick={() => reinitialize(apiKey, label)}
                                                >
                                                    <IconRefresh size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </Group>
                                </Card>
                            </Grid.Col>
                        );
                    })}
                </Grid>

                {!noConnection && (
                    <Group justify="flex-end">
                        <Button
                            color="red"
                            variant="light"
                            size="xs"
                            loading={reinitAllLoading}
                            onClick={openConfirm}
                        >
                            Reinitialize All
                        </Button>
                    </Group>
                )}
            </Stack>
        </>
    );
}
