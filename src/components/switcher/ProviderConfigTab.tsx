import { useEffect, useState, useContext } from 'react';
import { Stack, Select, TextInput, NumberInput, Switch, Button, Fieldset, Group, Text } from '@mantine/core';
import { ConfigContext } from '@/ApplicationContext';
import { getSwitcherConfig, putSwitcherConfig, SwitcherConfig, ProviderType } from '@/api/switcher';

const PROVIDER_OPTIONS: { value: ProviderType; label: string }[] = [
    { value: 'nginx-rtmp', label: 'nginx-rtmp' },
    { value: 'nms', label: 'NMS' },
    { value: 'nimble', label: 'Nimble Streamer' },
    { value: 'sls', label: 'SLS' },
    { value: 'belabox', label: 'Belabox' },
    { value: 'mediamtx', label: 'MediaMTX' },
    { value: 'rist', label: 'RIST' },
    { value: 'xiu', label: 'Xiu' },
    { value: 'irl-hosting', label: 'IRL Hosting' },
    { value: 'openirl', label: 'OpenIRL' },
];

type FieldDef = { key: string; label: string; type: 'text' | 'select'; options?: string[] };

const PROVIDER_FIELDS: Record<ProviderType, FieldDef[]> = {
    'nginx-rtmp':  [{ key: 'app', label: 'App (default: live)', type: 'text' }, { key: 'stream_key', label: 'Stream Key', type: 'text' }],
    'nms':         [{ key: 'app', label: 'App (default: live)', type: 'text' }, { key: 'stream_key', label: 'Stream Key', type: 'text' }],
    'nimble':      [{ key: 'protocol', label: 'Protocol', type: 'select', options: ['rtmp', 'srt'] }, { key: 'stream_name', label: 'Stream Name', type: 'text' }],
    'sls':         [{ key: 'publisher_id', label: 'Publisher ID', type: 'text' }],
    'belabox':     [{ key: 'publisher_id', label: 'Publisher ID', type: 'text' }],
    'mediamtx':    [{ key: 'srt_id', label: 'SRT ID (optional)', type: 'text' }],
    'xiu':         [{ key: 'app_name', label: 'App Name', type: 'text' }, { key: 'stream_name', label: 'Stream Name', type: 'text' }],
    'irl-hosting': [{ key: 'protocol', label: 'Protocol', type: 'select', options: ['srt', 'rtmp'] }],
    'openirl':     [{ key: 'stream_id', label: 'Stream ID', type: 'text' }],
    'rist':        [],
};

const DEFAULT_CONFIG: SwitcherConfig = {
    provider_type: 'nginx-rtmp',
    stats_url: '',
    poll_interval_ms: 2000,
    provider_config: {},
    enabled: false,
};

export function ProviderConfigTab() {
    const config = useContext(ConfigContext);
    const [, forceUpdate] = useState(0);
    const channel = config.getChatChannel();
    const [form, setForm] = useState<SwitcherConfig>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!channel) return;
        getSwitcherConfig(channel)
            .then(data => setForm(data ?? DEFAULT_CONFIG))
            .catch(() => {});
    }, [channel]);

    const setField = <K extends keyof SwitcherConfig>(key: K, value: SwitcherConfig[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const setProviderConfigField = (key: string, value: string) =>
        setForm(f => ({ ...f, provider_config: { ...f.provider_config, [key]: value } }));

    const handleSave = async () => {
        if (!channel) return;
        setSaving(true);
        try {
            const cleanedConfig = Object.fromEntries(
                Object.entries(form.provider_config).filter(([, v]) => v !== '')
            );
            await putSwitcherConfig(channel, { ...form, provider_config: cleanedConfig });
        } finally {
            setSaving(false);
        }
    };

    const extraFields = PROVIDER_FIELDS[form.provider_type] ?? [];

    return (
        <Stack mt={16} gap={16} p="md">
            <Fieldset legend="Stats Provider" variant="filled">
                <Stack gap="sm">
                    <Select
                        label="Provider"
                        data={PROVIDER_OPTIONS}
                        value={form.provider_type}
                        onChange={v => setField('provider_type', (v as ProviderType) ?? 'nginx-rtmp')}
                    />
                    <TextInput
                        label="Stats URL"
                        placeholder="http://localhost/stat"
                        value={form.stats_url}
                        onChange={e => setField('stats_url', e.currentTarget.value)}
                    />
                    <NumberInput
                        label="Poll Interval (ms)"
                        value={form.poll_interval_ms}
                        min={500}
                        step={500}
                        onChange={v => setField('poll_interval_ms', Number(v) || 2000)}
                    />
                    <Switch
                        label="Enabled"
                        size="lg"
                        checked={form.enabled}
                        onChange={e => setField('enabled', e.currentTarget.checked)}
                    />
                </Stack>
            </Fieldset>

            {extraFields.length > 0 && (
                <Fieldset legend="Provider Config" variant="filled">
                    <Stack gap="sm">
                        {extraFields.map(field =>
                            field.type === 'select' ? (
                                <Select
                                    key={field.key}
                                    label={field.label}
                                    data={field.options ?? []}
                                    value={form.provider_config[field.key] ?? ''}
                                    onChange={v => setProviderConfigField(field.key, v ?? '')}
                                />
                            ) : (
                                <TextInput
                                    key={field.key}
                                    label={field.label}
                                    value={form.provider_config[field.key] ?? ''}
                                    onChange={e => setProviderConfigField(field.key, e.currentTarget.value)}
                                />
                            )
                        )}
                    </Stack>
                </Fieldset>
            )}

            <Fieldset legend="Display" variant="filled">
                <Stack gap="sm">
                    <Switch
                        label="Show Bitrate Indicator"
                        size="lg"
                        checked={config.showBitrateIndicator}
                        onChange={e => {
                            config.setShowBitrateIndicator(e.currentTarget.checked);
                            forceUpdate(n => n + 1);
                        }}
                    />
                    <Text fs="italic" size="14px">Show the bitrate indicator in the switcher overlay</Text>
                    <Switch
                        label="Show Scene Name"
                        size="lg"
                        checked={config.showSceneName}
                        onChange={e => {
                            config.setShowSceneName(e.currentTarget.checked);
                            forceUpdate(n => n + 1);
                        }}
                    />
                    <Text fs="italic" size="14px">Show the current OBS scene name below the header</Text>
                </Stack>
            </Fieldset>

            <Group justify="flex-end">
                <Button loading={saving} onClick={handleSave}>Save</Button>
            </Group>
        </Stack>
    );
}
