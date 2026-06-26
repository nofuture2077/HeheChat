import { DraggableProvided } from '@hello-pangea/dnd';
import { ActionIcon, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconEdit, IconGripVertical, IconTrash } from '@tabler/icons-react';
import { ShortCut, TOGGLEABLE_CONFIG_VALUES } from '../../commons/shortcuts';
import classes from './ShortcutSettingsItem.module.css';

const shortcutTypeLabels: Record<ShortCut['type'], string> = {
  clip: 'Clip',
  marker: 'Marker',
  chat: 'Chat',
  adbreak: 'Run Ad',
  toggle: 'Toggle Config',
  scene: 'Switch Scene',
};

function getShortcutDetail(shortcut: ShortCut) {
  if (shortcut.type === 'toggle') {
    const configKey = shortcut.params[0];
    return (
      TOGGLEABLE_CONFIG_VALUES.find((option) => option.value === configKey)?.label ||
      configKey ||
      'No config selected'
    );
  }

  if (shortcut.type === 'scene') {
    return shortcut.params[0] ? `Scene: ${shortcut.params[0]}` : 'No scene selected';
  }

  return (
    shortcut.params.join(', ') || (shortcut.input ? 'Uses runtime input' : 'No text configured')
  );
}

export function ShortcutSettingsItem(props: {
  shortcut: ShortCut;
  provided: DraggableProvided;
  onEdit: (shortcut: ShortCut) => void;
  onDelete: (shortcutId: string) => void;
}) {
  const detail = getShortcutDetail(props.shortcut);

  return (
    <Paper
      ref={props.provided.innerRef}
      {...props.provided.draggableProps}
      className={classes.shortcut}
      shadow="xs"
      p="sm"
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <div
            className={classes.dragHandle}
            {...props.provided.dragHandleProps}
            aria-label={`Reorder ${props.shortcut.name}`}
          >
            <IconGripVertical size={16} />
          </div>
          <div
            className={classes.colorSwatch}
            style={{ backgroundColor: props.shortcut.color }}
            aria-hidden="true"
          />
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="wrap">
              <Text size="sm" fw={500}>
                {props.shortcut.name}
              </Text>
              <Badge size="xs" variant="light">
                {shortcutTypeLabels[props.shortcut.type]}
              </Badge>
              {props.shortcut.input && (
                <Badge size="xs" variant="outline" color="gray">
                  Input
                </Badge>
              )}
              {props.shortcut.confirm && (
                <Badge size="xs" variant="outline" color="yellow">
                  Confirm
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed" truncate>
              {detail}
            </Text>
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            onClick={() => props.onEdit(props.shortcut)}
            aria-label={`Edit ${props.shortcut.name}`}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => props.onDelete(props.shortcut.id)}
            aria-label={`Delete ${props.shortcut.name}`}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
