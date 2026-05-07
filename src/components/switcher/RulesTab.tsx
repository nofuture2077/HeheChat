import { useEffect, useState, useContext } from 'react';
import {
    Stack, Table, Button, ActionIcon, Switch, Group, Modal,
    Select, NumberInput, Text, Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react';
import PubSub from 'pubsub-js';
import { ConfigContext } from '@/ApplicationContext';
import {
    getSwitcherRules, getSwitcherScenes, postSwitcherRule, putSwitcherRule, deleteSwitcherRule,
    SwitcherRule, SwitcherRuleInput,
} from '@/api/switcher';

const METRICS = [
    { value: 'bitrate_kbps', label: 'Bitrate (kbps)' },
    { value: 'rtt_ms', label: 'RTT (ms)' },
];
const OPERATORS = [
    { value: '<', label: '<' },
    { value: '>', label: '>' },
    { value: '<=', label: '<=' },
    { value: '>=', label: '>=' },
];

const EMPTY_RULE: SwitcherRuleInput = {
    priority: 10,
    condition: { metric: 'bitrate_kbps', operator: '<', value: 1000, duration_ms: 0 },
    target_scene: '',
    cooldown_ms: 30000,
    enabled: true,
    scene_group: null,
};

function RuleModal({
    opened, onClose, onSave, initial, scenes, existingGroups,
}: {
    opened: boolean;
    onClose: () => void;
    onSave: (rule: SwitcherRuleInput) => Promise<void>;
    initial: SwitcherRuleInput;
    scenes: string[];
    existingGroups: string[];
}) {
    const [form, setForm] = useState<SwitcherRuleInput>(initial);
    const [saving, setSaving] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');

    useEffect(() => { setForm(initial); setGroupSearch(''); }, [initial]);

    const setField = <K extends keyof SwitcherRuleInput>(key: K, value: SwitcherRuleInput[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const setCondField = <K extends keyof SwitcherRuleInput['condition']>(
        key: K, value: SwitcherRuleInput['condition'][K]
    ) => setForm(f => ({ ...f, condition: { ...f.condition, [key]: value } }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Scene Switching Rule" zIndex={400}>
            <Stack gap="sm">
                <NumberInput label="Priority" value={form.priority} min={1} onChange={v => setField('priority', Number(v) || 1)} />
                <Select label="Metric" data={METRICS} value={form.condition.metric} onChange={v => setCondField('metric', (v as any) ?? 'bitrate_kbps')} styles={{ dropdown: { zIndex: 401 } }} />
                <Select label="Operator" data={OPERATORS} value={form.condition.operator} onChange={v => setCondField('operator', (v as any) ?? '<')} styles={{ dropdown: { zIndex: 401 } }} />
                <NumberInput label="Value" value={form.condition.value} onChange={v => setCondField('value', Number(v) || 0)} />
                <NumberInput label="Duration (ms)" description="How long condition must hold. 0 = instant" value={form.condition.duration_ms} min={0} step={500} onChange={v => setCondField('duration_ms', Number(v) || 0)} />
                <Select
                    label="Target Scene"
                    data={scenes.map(s => ({ value: s, label: s }))}
                    value={form.target_scene}
                    onChange={v => setField('target_scene', v ?? '')}
                    placeholder={scenes.length === 0 ? 'No scenes available' : 'Select scene'}
                    styles={{ dropdown: { zIndex: 401 } }}
                />
                <NumberInput label="Cooldown (ms)" value={form.cooldown_ms} min={0} step={1000} onChange={v => setField('cooldown_ms', Number(v) || 0)} />
                <Select
                    label="Scene Group"
                    description="Rules only fire when the current scene belongs to this group"
                    data={[
                        ...existingGroups.map(g => ({ value: g, label: g })),
                        ...(groupSearch && !existingGroups.includes(groupSearch)
                            ? [{ value: groupSearch, label: `Create "${groupSearch}"` }]
                            : []),
                    ]}
                    value={form.scene_group ?? null}
                    onChange={v => setField('scene_group', v ?? null)}
                    searchable
                    clearable
                    searchValue={groupSearch}
                    onSearchChange={setGroupSearch}
                    placeholder="No group (ungrouped)"
                    styles={{ dropdown: { zIndex: 401 } }}
                />
                <Switch label="Enabled" size="lg" checked={form.enabled} onChange={e => setField('enabled', e.currentTarget.checked)} />
                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={onClose}>Cancel</Button>
                    <Button loading={saving} onClick={handleSave}>Save</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export function RulesTab() {
    const config = useContext(ConfigContext);
    const channel = config.getChatChannel();
    const [rules, setRules] = useState<SwitcherRule[]>([]);
    const [scenes, setScenes] = useState<string[]>([]);
    const [editing, setEditing] = useState<SwitcherRule | null>(null);
    const [modalOpened, modalHandlers] = useDisclosure(false);

    useEffect(() => {
        if (!channel) return;
        getSwitcherRules(channel).then(setRules).catch(() => {});
        getSwitcherScenes(channel).then(d => setScenes(d.scenes ?? [])).catch(() => {});

        const sub = PubSub.subscribe('WS-sceneList', (_: string, data: { scenes: string[] }) => {
            setScenes(data.scenes ?? []);
        });
        return () => { PubSub.unsubscribe(sub); };
    }, [channel]);

    const openCreate = () => { setEditing(null); modalHandlers.open(); };
    const openEdit = (rule: SwitcherRule) => { setEditing(rule); modalHandlers.open(); };

    const handleSave = async (input: SwitcherRuleInput) => {
        if (!channel) return;
        if (editing) {
            await putSwitcherRule(channel, editing.id, input);
            setRules(r => r.map(x => x.id === editing.id ? { ...x, ...input } : x));
        } else {
            const created = await postSwitcherRule(channel, input);
            setRules(r => [...r, created].sort((a, b) => a.priority - b.priority));
        }
    };

    const handleDelete = async (rule: SwitcherRule) => {
        if (!channel) return;
        await deleteSwitcherRule(channel, rule.id).catch(() => {});
        setRules(r => r.filter(x => x.id !== rule.id));
    };

    const handleToggle = async (rule: SwitcherRule, enabled: boolean) => {
        if (!channel) return;
        setRules(r => r.map(x => x.id === rule.id ? { ...x, enabled } : x));
        await putSwitcherRule(channel, rule.id, { enabled }).catch(() => {
            setRules(r => r.map(x => x.id === rule.id ? { ...x, enabled: rule.enabled } : x));
        });
    };

    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const existingGroups = [...new Set(rules.map(r => r.scene_group).filter(Boolean))] as string[];

    return (
        <Stack mt={16} gap={12} p="md">
            <RuleModal
                opened={modalOpened}
                onClose={modalHandlers.close}
                onSave={handleSave}
                initial={editing ? { ...editing } : EMPTY_RULE}
                scenes={scenes}
                existingGroups={existingGroups}
            />

            <Group justify="flex-end">
                <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openCreate}>
                    Add Rule
                </Button>
            </Group>

            {sorted.length === 0 ? (
                <Text size="sm" c="dimmed">No rules configured.</Text>
            ) : (
                <Table striped withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>#</Table.Th>
                            <Table.Th>Condition</Table.Th>
                            <Table.Th>Scene</Table.Th>
                            <Table.Th>Group</Table.Th>
                            <Table.Th>On</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sorted.map(rule => (
                            <Table.Tr key={rule.id}>
                                <Table.Td>{rule.priority}</Table.Td>
                                <Table.Td>
                                    <Text size="xs">
                                        {rule.condition.metric} {rule.condition.operator} {rule.condition.value}
                                        {rule.condition.duration_ms > 0 && (
                                            <Badge size="xs" ml={4} variant="light">
                                                {rule.condition.duration_ms}ms
                                            </Badge>
                                        )}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="xs">{rule.target_scene || '—'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    {rule.scene_group
                                        ? <Badge size="xs" variant="light" color="blue">{rule.scene_group}</Badge>
                                        : <Text size="xs" c="dimmed">—</Text>}
                                </Table.Td>
                                <Table.Td>
                                    <Switch
                                        size="sm"
                                        checked={rule.enabled}
                                        onChange={e => handleToggle(rule, e.currentTarget.checked)}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        <ActionIcon size="sm" variant="subtle" onClick={() => openEdit(rule)}>
                                            <IconPencil size={14} />
                                        </ActionIcon>
                                        <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(rule)}>
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </Stack>
    );
}
