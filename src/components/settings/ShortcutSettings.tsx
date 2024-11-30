import { Stack, Fieldset, Button, TextInput, Select, ActionIcon, Group, Text, Modal, Switch } from '@mantine/core';
import { useContext, useState } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { ShortCut, ShortCutType } from '../../commons/shortcuts';
import { IconTrash, IconEdit, IconPlus, IconCheck } from '@tabler/icons-react';
import { generateGUID } from '@/commons/helper';

const shortcutTypes = [
    { value: 'clip', label: 'Clip' },
    { value: 'marker', label: 'Marker' },
    { value: 'chat', label: 'Chat' },
    { value: 'adbreak', label: 'Run Ad' },
];

const colorOptions = [
    { value: '#be4bdb', label: 'Grape' },
    { value: '#4263eb', label: 'Indigo' },
    { value: '#f76707', label: 'Orange' },
    { value: '#e64980', label: 'Pink' },
    { value: '#0ca678', label: 'Teal' },
    { value: '#f59f00', label: 'Yellow' }
];

export function ShortcutSettings() {
    const config = useContext(ConfigContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<ShortCut | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<ShortCutType>('clip');
    const [color, setColor] = useState(colorOptions[0].value);
    const [input, setInput] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [params, setParams] = useState('');

    const resetForm = () => {
        setName('');
        setType('clip');
        setColor(colorOptions[0].value);
        setParams('');
        setEditingShortcut(null);
        setModalOpen(false);
    };

    const handleSave = () => {
        const newShortcut: ShortCut = {
            id: editingShortcut?.id || generateGUID(),
            name,
            type,
            color,
            input,
            confirm,
            params: params.split(',').map(p => p.trim()).filter(p => p !== '')
        };

        const updatedShortcuts = editingShortcut
            ? config.shortcuts.map(s => s.id === editingShortcut.id ? newShortcut : s)
            : [...(config.shortcuts || []), newShortcut];

        config.setShortcuts(updatedShortcuts);
        resetForm();
    };

    const handleEdit = (shortcut: ShortCut) => {
        setEditingShortcut(shortcut);
        setName(shortcut.name);
        setType(shortcut.type);
        setColor(shortcut.color);
        setParams(shortcut.params.join(', '));
        setModalOpen(true);
    };

    const handleDelete = (id: string) => {
        config.setShortcuts(config.shortcuts.filter(s => s.id !== id));
    };

    const handleAddNew = () => {
        resetForm();
        setModalOpen(true);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Modal
                opened={modalOpen}
                onClose={resetForm}
                title={editingShortcut ? 'Edit Shortcut' : 'Add New Shortcut'}
                size="md"
                zIndex={1000}
            >
                <Stack gap="md">
                    <TextInput
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter shortcut name"
                    />
                    <Select
                        label="Type"
                        data={shortcutTypes}
                        value={type}
                        onChange={(value) => value && setType(value as ShortCutType)}
                        styles={{ dropdown: { zIndex: 1001 } }}
                    />
                    <Stack gap="xs">
                        <Text size="sm">Color</Text>
                        <Group gap="xs" justify='space-around'>
                            {colorOptions.map((option) => (
                                <ActionIcon
                                    key={option.value}
                                    variant="subtle"
                                    size="lg"
                                    radius="xl"
                                    aria-label={option.label}
                                    onClick={() => setColor(option.value)}
                                    style={{
                                        backgroundColor: option.value,
                                        border: color === option.value ? '2px solid white' : 'none',
                                        boxShadow: color === option.value ? '0 0 0 2px #228be6' : 'none'
                                    }}
                                >
                                    {color === option.value && (
                                        <IconCheck style={{ color: 'white' }} size={16} />
                                    )}
                                </ActionIcon>
                            ))}
                        </Group>
                    </Stack>
                    <TextInput
                        label="Text"
                        value={params}
                        onChange={(e) => setParams(e.target.value)}
                        placeholder="e.g. !live"
                    />
                    <Switch checked={input} onChange={(event) => setInput(event.currentTarget.checked)} label="Requires Input" size="lg" />
                    <Switch checked={confirm} onChange={(event) => setConfirm(event.currentTarget.checked)} label="Confirmation" size="lg" />
                    <Group justify="space-between" mt="md">
                        <Button variant="light" onClick={resetForm}>Cancel</Button>
                        <Button onClick={handleSave}>{editingShortcut ? 'Update' : 'Add'}</Button>
                    </Group>
                </Stack>
            </Modal>

            <Group justify="space-between" align="center">
                <Text size="lg" fw={500}>Shortcuts</Text>
                <ActionIcon variant='light' onClick={handleAddNew} size='lg'>
                    <IconPlus></IconPlus>
                </ActionIcon>
            </Group>

            <Fieldset legend="Existing Shortcuts" variant='filled'>
                <Stack gap="md">
                    {(config.shortcuts || []).length === 0 ? (
                        <Text c="dimmed" ta="center">No shortcuts added yet</Text>
                    ) : (
                        config.shortcuts.map((shortcut) => (
                            <Group key={shortcut.id} justify="space-between">
                                <Group gap="xs">
                                    <ActionIcon variant="light" onClick={() => handleEdit(shortcut)} aria-label="Edit">
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                    <div style={{ 
                                        width: 16, 
                                        height: 16, 
                                        backgroundColor: shortcut.color,
                                        borderRadius: '4px'
                                    }} />
                                    <Text>{shortcut.name}</Text>
                                    <Text size="sm" c="dimmed">({shortcut.type})</Text>
                                </Group>
                                <Group gap="xs">
                                    <ActionIcon 
                                        variant="light" 
                                        color="red" 
                                        onClick={() => handleDelete(shortcut.id)}
                                        aria-label="Delete"
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            </Group>
                        ))
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
