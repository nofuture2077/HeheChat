import { Group, ActionIcon, Text, Modal, TextInput, Button, Stack, Badge, Card } from '@mantine/core';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '@/ApplicationContext';
import { ShortCut, shortcutHandler } from '@/commons/shortcuts';
import { 
    IconClipboard, 
    IconBookmark, 
    IconMessage, 
    IconSettings, 
    IconPlayerPause,
    IconCheck,
    IconAd,
    IconToggleLeft,
    IconToggleRight
} from '@tabler/icons-react';
import { Dictionary } from 'underscore';

const getIconForType = (type: string, isToggleOn?: boolean) => {
    switch (type) {
        case 'clip':
            return IconClipboard;
        case 'marker':
            return IconBookmark;
        case 'chat':
            return IconMessage;
        case 'settings':
            return IconSettings;
        case 'pause':
            return IconPlayerPause;
        case 'adbreak':
            return IconAd;
        case 'toggle':
            return isToggleOn ? IconToggleRight : IconToggleLeft;
        default:
            return IconMessage;
    }
};

const getConfigValue = (config: any, configKey: string): boolean => {
    return config[configKey] || false;
};

export function ShortcutView() {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);
    const loginContext = useContext(LoginContextContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeShortcut, setActiveShortcut] = useState<ShortCut | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [checkedShortcuts, setCheckedShortcuts] = useState<Dictionary<boolean>>({});

    // Initialize shortcutHandler with config
    useEffect(() => {
        shortcutHandler.setConfig(config);
    }, [config]);

    const handleShortcutClick = (shortcut: ShortCut) => {
        if (checkedShortcuts[shortcut.id]) {
            return;
        }

        if (shortcut.input || shortcut.confirm) {
            setActiveShortcut(shortcut);
            setModalOpen(true);
            setInputValue('');
        } else {
            shortcutHandler.handle(shortcut, loginContext.user?.id || '', '');
            setCheckedShortcuts(prev => ({
                ...prev,
                [shortcut.id]: true
            }));
            setTimeout(() => {
                setCheckedShortcuts(prev => ({
                    ...prev,
                    [shortcut.id]: false
                }));
            }, 2500);
        }
    };

    const handleConfirm = () => {
        if (activeShortcut) {
            const shortcutWithParams = {
                ...activeShortcut,
                params: [inputValue]
            };
            shortcutHandler.handle(shortcutWithParams, loginContext.user?.id || '', activeShortcut.params[0] ? (activeShortcut.params[0] + " " + inputValue) : inputValue);

            setCheckedShortcuts(prev => ({
                ...prev,
                [activeShortcut.id]: true
            }));
            setTimeout(() => {
                setCheckedShortcuts(prev => ({
                    ...prev,
                    [activeShortcut.id]: false
                }));
            }, 2500);
        }
        setModalOpen(false);
        setActiveShortcut(null);
        setInputValue('');
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.currentTarget.value);
    };

    return (
        <Card withBorder radius="md" p="sm" ml="sm" mr="sm" mt={0} mb={0}>
            <Group justify="center" gap="md">
                {config.shortcuts.map((shortcut) => {
                    let Icon;
                    let badgeText = shortcut.name;
                    
                    if (checkedShortcuts[shortcut.id]) {
                        Icon = IconCheck;
                    } else if (shortcut.type === 'toggle' && shortcut.params[0]) {
                        const isToggleOn = getConfigValue(config, shortcut.params[0]);
                        Icon = getIconForType(shortcut.type, isToggleOn);
                        badgeText = `${shortcut.name}`;
                    } else {
                        Icon = getIconForType(shortcut.type);
                    }
                    
                    return (
                        <Stack key={shortcut.id} align="center" gap={5}>
                            <ActionIcon
                                variant="filled"
                                size="xl"
                                radius="xl"
                                onClick={() => handleShortcutClick(shortcut)}
                                style={{ backgroundColor: shortcut.color }}
                            >
                                <Icon/>
                            </ActionIcon>
                            <Badge size="xs" ta="center" bg="primary">{badgeText}</Badge>
                        </Stack>
                    );
                })}
            </Group>

            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={activeShortcut?.name}
                size="sm"
            >
                <Stack>
                    {activeShortcut?.input && (
                        <TextInput
                            label="Input"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Enter value"
                        />
                    )}
                    {activeShortcut?.confirm && (
                        <Text size="sm">Are you sure you want to execute this shortcut?</Text>
                    )}
                    <Group justify="space-between" mt="md">
                        <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button color="pink" onClick={handleConfirm}>Confirm</Button>
                    </Group>
                </Stack>
            </Modal>
        </Card>
    );
}
