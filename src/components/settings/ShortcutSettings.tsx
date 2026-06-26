import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Stack,
  Button,
  TextInput,
  Select,
  ActionIcon,
  Group,
  Text,
  Modal,
  Switch,
  Alert,
} from '@mantine/core';
import { IconInfoCircle, IconPlus, IconCheck } from '@tabler/icons-react';
import { useContext, useState } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { ShortCut, ShortCutType, TOGGLEABLE_CONFIG_VALUES } from '../../commons/shortcuts';
import { generateGUID } from '@/commons/helper';
import { ShortcutSettingsItem } from './ShortcutSettingsItem';

const shortcutTypes = [
  { value: 'clip', label: 'Clip' },
  { value: 'marker', label: 'Marker' },
  { value: 'chat', label: 'Chat' },
  { value: 'adbreak', label: 'Run Ad' },
  { value: 'toggle', label: 'Toggle Config' },
  { value: 'scene', label: 'Switch Scene' },
];

const colorOptions = [
  { value: '#be4bdb', label: 'Grape' },
  { value: '#4263eb', label: 'Indigo' },
  { value: '#f76707', label: 'Orange' },
  { value: '#e64980', label: 'Pink' },
  { value: '#0ca678', label: 'Teal' },
  { value: '#f59f00', label: 'Yellow' },
];

export function ShortcutSettings() {
  const config = useContext(ConfigContext);
  const shortcuts = config.shortcuts || [];
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
    setInput(false);
    setConfirm(false);
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
      params:
        type === 'toggle' || type === 'scene'
          ? [params]
          : params
              .split(',')
              .map((p) => p.trim())
              .filter((p) => p !== ''),
    };

    const updatedShortcuts = editingShortcut
      ? config.shortcuts.map((s) => (s.id === editingShortcut.id ? newShortcut : s))
      : [...(config.shortcuts || []), newShortcut];

    config.setShortcuts(updatedShortcuts);
    resetForm();
  };

  const handleEdit = (shortcut: ShortCut) => {
    setEditingShortcut(shortcut);
    setName(shortcut.name);
    setType(shortcut.type);
    setColor(shortcut.color);
    setParams(
      shortcut.type === 'toggle' || shortcut.type === 'scene'
        ? shortcut.params[0] || ''
        : shortcut.params.join(', ')
    );
    setInput(shortcut.input);
    setConfirm(shortcut.confirm);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    config.setShortcuts(config.shortcuts.filter((s) => s.id !== id));
  };

  const handleAddNew = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    const items = Array.from(shortcuts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    config.setShortcuts(items);
  };

  return (
    <Stack mt={30} mb={30} gap={30} p="lg">
      <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
        Shortcuts are quick-action buttons shown in the chat toolbar. Each shortcut can clip, add a
        stream marker, send a chat message, run an ad, toggle a config value, or switch an OBS
        scene. Enable &quot;Confirm&quot; to require a confirmation tap before the action fires.
      </Alert>
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
            <Group gap="xs" justify="space-around">
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
                    boxShadow: color === option.value ? '0 0 0 2px #228be6' : 'none',
                  }}
                >
                  {color === option.value && <IconCheck style={{ color: 'white' }} size={16} />}
                </ActionIcon>
              ))}
            </Group>
          </Stack>
          {type === 'toggle' ? (
            <Select
              label="Config Value to Toggle"
              data={TOGGLEABLE_CONFIG_VALUES}
              value={params}
              onChange={(value) => setParams(value || '')}
              placeholder="Select a config value to toggle"
              searchable
              styles={{ dropdown: { zIndex: 1001 } }}
            />
          ) : type === 'scene' ? (
            <TextInput
              label="Scene Name"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              placeholder="e.g. Starting Soon"
            />
          ) : (
            <TextInput
              label="Text"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              placeholder="e.g. !live"
            />
          )}

          {type !== 'toggle' && type !== 'scene' && (
            <Switch
              checked={input}
              onChange={(event) => setInput(event.currentTarget.checked)}
              label="Input"
              size="lg"
            />
          )}
          <Switch
            checked={confirm}
            onChange={(event) => setConfirm(event.currentTarget.checked)}
            label="Confirm"
            size="lg"
          />

          <Text fs="italic">
            {type === 'toggle'
              ? 'Toggle shortcuts will switch the selected config value between true and false. Confirm makes sure that a shortcut is only executed after confirmation.'
              : type === 'scene'
                ? 'Scene shortcuts switch to the specified OBS scene when clicked. Confirm makes sure that the switch only happens after confirmation.'
                : 'Input can be used to set the streammarkers name. Confirm makes sure that a shortcut is only executed after confirmation.'}
          </Text>
          <Group justify="space-between" mt="md">
            <Button variant="light" onClick={resetForm}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave}>
              {editingShortcut ? 'Update' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <Text size="lg" fw={500}>
          Shortcuts
        </Text>
      </Group>

      <Stack gap="xs">
        {shortcuts.length === 0 ? (
          <Text c="dimmed" ta="center">
            No shortcuts added yet
          </Text>
        ) : (
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="shortcuts">
              {(dropProvided) => (
                <Stack gap={0} {...dropProvided.droppableProps} ref={dropProvided.innerRef}>
                  {shortcuts.map((shortcut, index) => (
                    <Draggable key={shortcut.id} draggableId={shortcut.id} index={index}>
                      {(dragProvided) => (
                        <ShortcutSettingsItem
                          shortcut={shortcut}
                          provided={dragProvided}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      )}
                    </Draggable>
                  ))}
                  {dropProvided.placeholder}
                </Stack>
              )}
            </Droppable>
          </DragDropContext>
        )}
        <ActionIcon
          size={32}
          radius="xl"
          variant="filled"
          color="primary"
          m="0 auto 20px"
          onClick={handleAddNew}
        >
          <IconPlus />
        </ActionIcon>
      </Stack>
    </Stack>
  );
}
