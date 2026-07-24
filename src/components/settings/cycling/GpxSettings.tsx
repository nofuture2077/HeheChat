import { useContext, useEffect, useRef, useState } from 'react';
import { Stack, Text, Fieldset, Group, FileButton, Button, ActionIcon, Radio, Switch, SegmentedControl, Alert, Loader } from '@mantine/core';
import { IconTrash, IconInfoCircle, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PubSub from 'pubsub-js';
import { ConfigContext, PremiumContext } from '@/ApplicationContext';
import { PremiumRequired } from '../../switcher/PremiumRequired';
import { GpxApiClient } from '@/api/gpx';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface GpxFile {
    id: number;
    filename: string;
    size_bytes: number;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GpxSettings() {
    const premium = useContext(PremiumContext);
    const config = useContext(ConfigContext);
    const token = localStorage.getItem('hehe-token_state') || '';

    const [files, setFiles] = useState<GpxFile[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const resetRef = useRef<() => void>(null);

    const loadFiles = () => {
        if (!token) return;
        setLoading(true);
        GpxApiClient.list(token)
            .then((data) => setFiles(data || []))
            .catch(() => notifications.show({ title: 'Error', message: 'Failed to load GPX files', color: 'red' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (premium.isPremium) {
            loadFiles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [premium.isPremium]);

    if (!premium.isPremium) {
        return (
            <Stack mt={30} mb={30} gap={20}>
                <PremiumRequired />
                <Group justify="center">
                    <Button onClick={() => PubSub.publish('OPEN_PREMIUM')}>Upgrade to Pro</Button>
                </Group>
            </Stack>
        );
    }

    const handleUpload = async (file: File | null) => {
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            notifications.show({ title: 'File too large', message: 'GPX files must be smaller than 20MB', color: 'red' });
            resetRef.current?.();
            return;
        }
        setUploading(true);
        try {
            await GpxApiClient.upload(token, file);
            notifications.show({ title: 'Uploaded', message: `${file.name} uploaded successfully`, color: 'green' });
            loadFiles();
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to upload GPX file', color: 'red' });
        } finally {
            setUploading(false);
            resetRef.current?.();
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await GpxApiClient.remove(token, id);
            if (activeId === id) setActiveId(null);
            loadFiles();
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to delete GPX file', color: 'red' });
        }
    };

    const handleSelect = async (value: string) => {
        const id = Number(value);
        try {
            const result = await GpxApiClient.selectActive(token, id);
            setActiveId(result.active.id);
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to select GPX file', color: 'red' });
        }
    };

    const activeFile = files.find(f => f.id === activeId);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Upload a GPX track to show live position, elevation and remaining
                distance on the cycling HUD. Only one track can be active at a time.
            </Alert>
            <Fieldset legend="GPX Tracks" variant="filled">
                <Stack gap="md">
                    <Group>
                        <FileButton resetRef={resetRef} onChange={handleUpload} accept=".gpx">
                            {(props) => (
                                <Button {...props} leftSection={<IconUpload size={18} />} loading={uploading}>
                                    Upload GPX
                                </Button>
                            )}
                        </FileButton>
                        {loading && <Loader size="sm" />}
                    </Group>
                    {files.length === 0 && !loading && (
                        <Text size="sm" c="dimmed">No GPX files uploaded yet.</Text>
                    )}
                    {files.length > 0 && (
                        <Radio.Group value={activeFile ? String(activeFile.id) : ''} onChange={handleSelect}>
                            <Stack gap="xs">
                                {files.map(file => (
                                    <Group key={file.id} justify="space-between">
                                        <Radio value={String(file.id)} label={`${file.filename} (${formatBytes(file.size_bytes)})`} />
                                        <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(file.id)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                ))}
                            </Stack>
                        </Radio.Group>
                    )}
                </Stack>
            </Fieldset>
            {activeFile && (
                <Fieldset legend="Cycling HUD GPX Sections" variant="filled">
                    <Stack gap="sm">
                        <Switch
                          label="Show map"
                          checked={config.showGpxMap}
                          onChange={e => config.setShowGpxMap(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Show elevation map"
                          checked={config.showGpxElevationMap}
                          onChange={e => config.setShowGpxElevationMap(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Show position on map"
                          checked={config.showGpxPosition}
                          onChange={e => config.setShowGpxPosition(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Show position on elevation map"
                          checked={config.showGpxElevationPosition}
                          onChange={e => config.setShowGpxElevationPosition(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Show remaining distance"
                          checked={config.showGpxRemainingDistance}
                          onChange={e => config.setShowGpxRemainingDistance(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Show remaining elevation"
                          checked={config.showGpxRemainingElevation}
                          onChange={e => config.setShowGpxRemainingElevation(e.currentTarget.checked)}
                        />
                        <Text size="sm" mt="sm">Map radius</Text>
                        <SegmentedControl
                          value={config.gpxMapRadius === null ? 'full' : String(config.gpxMapRadius)}
                          onChange={value => config.setGpxMapRadius(value === 'full' ? null : Number(value))}
                          data={[
                              { label: 'Full track', value: 'full' },
                              { label: '1 km', value: '1000' },
                              { label: '2 km', value: '2000' },
                              { label: '5 km', value: '5000' },
                          ]}
                        />
                    </Stack>
                </Fieldset>
            )}
        </Stack>
    );
}
