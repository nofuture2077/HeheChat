import { Button, Group, Title, TextInput, MultiSelect, Switch, NumberInput, Combobox, InputBase, Image, Text, Flex, ScrollArea, useCombobox } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { LoginContextContext } from '@/ApplicationContext';
import { IconX } from '@tabler/icons-react';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

import { OverlayDrawer } from '@/pages/Chat.page';

export const StreamInfoDrawer: OverlayDrawer = {
    name: 'streaminfo',
    component: StreamInfo,
    size: 400,
    position: 'right'
}

export interface StreamInfoProps {
    close: () => void;
}

export function StreamInfo({ close }: StreamInfoProps) {
    const login = useContext(LoginContextContext);
    const [gameSearchResults, setGameSearchResults] = useState<Array<{
        id: string;
        name: string;
        boxArtUrl: string;
    }>>([]);
    const [gameSearchValue, setGameSearchValue] = useState('');
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const [classificationLabels, setClassificationLabels] = useState<{ value: string; label: string }[]>([]);
    const [streamInfo, setStreamInfo] = useState({
        title: '',
        gameId: '',
        language: '',
        delay: 0,
        tags: [] as string[],
        isBrandedContent: false,
        contentClassificationLabels: [] as string[]
    });

    const loadStreamInfo = async () => {
        try {
            const token = localStorage.getItem('hehe-token_state') || '';
            const response = await fetch(`${BASE_URL}/twitch/channels/info?state=${token}`);
            if (response.ok) {
                const streamData = await response.json();
                setStreamInfo({
                    title: streamData.title || '',
                    gameId: streamData.gameId || '',
                    language: streamData.language || '',
                    delay: streamData.delay || 0,
                    tags: streamData.tags || [],
                    isBrandedContent: streamData.isBrandedContent || false,
                    contentClassificationLabels: streamData.contentClassificationLabels || []
                });
                setGameSearchValue(streamData.gameName || '');
            }
        } catch (error) {
            console.error('Error loading stream info:', error);
        }
    };

    const loadClassificationLabels = async () => {
        try {
            const response = await fetch(`${BASE_URL}/twitch/content/classification/labels`);
            if (response.ok) {
                const labels = await response.json();
                setClassificationLabels(labels.map((label: { id: string; name: string; description: string }) => ({
                    value: label.id,
                    label: label.name
                })));
            }
        } catch (error) {
            console.error('Error loading classification labels:', error);
        }
    };

    useEffect(() => {
        if (login.user?.name) {
            loadStreamInfo();
            loadClassificationLabels();
        }
    }, [login.user?.name]);

    return (
        <ScrollArea h="100vh" maw="100%" scrollbars="y">  
            <nav style={{ width: '100%', height: '100%', minHeight: '100vh', padding: '20px' }}>         
                <Group justify="space-between" mb="lg">
                    <Title order={4}>Edit Stream Info</Title>
                    <Button variant="subtle" color="primary" onClick={close}>
                        <IconX/>
                    </Button>
                </Group>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        const token = localStorage.getItem('hehe-token_state') || '';
                        const response = await fetch(`${BASE_URL}/twitch/channels/update?state=${token}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(streamInfo)
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to update stream info');
                        }
                        
                        close();
                    } catch (error) {
                        console.error('Error updating stream info:', error);
                    }
                }}>
                    <TextInput
                        label="Title"
                        value={streamInfo.title}
                        onChange={(e) => setStreamInfo(prev => ({ ...prev, title: e.target.value }))}
                        mb="md"
                    />
                    <Combobox
                        store={combobox}
                        onOptionSubmit={(val) => {
                            const game = gameSearchResults.find(g => g.id === val);
                            if (game) {
                                setStreamInfo(prev => ({ ...prev, gameId: game.id }));
                                setGameSearchValue(game.name);
                            }
                            combobox.closeDropdown();
                        }}
                    >
                        <Combobox.Target>
                            <InputBase
                                label="Game"
                                value={gameSearchValue}
                                onChange={async (event) => {
                                    const value = event.currentTarget.value;
                                    setGameSearchValue(value);
                                    combobox.openDropdown();

                                    if (value.length >= 2) {
                                        try {
                                            const response = await fetch(`${BASE_URL}/twitch/categories/search?query=${encodeURIComponent(value)}`);
                                            if (response.ok) {
                                                const data = await response.json();
                                                setGameSearchResults(data.data);
                                            }
                                        } catch (error) {
                                            console.error('Error searching games:', error);
                                        }
                                    }
                                }}
                                onClick={() => combobox.openDropdown()}
                                onFocus={() => combobox.openDropdown()}
                                placeholder="Search for a game"
                                mb="md"
                            />
                        </Combobox.Target>

                        <Combobox.Dropdown>
                            <Combobox.Options>
                                {gameSearchResults.map((game) => (
                                    <Combobox.Option value={game.id} key={game.id}>
                                        <Flex align="center" gap="sm">
                                            <Image
                                                src={game.boxArtUrl.replace('{width}', '40').replace('{height}', '53')}
                                                width={40}
                                                height={53}
                                                alt={game.name}
                                            />
                                            <Text size="sm">{game.name}</Text>
                                        </Flex>
                                    </Combobox.Option>
                                ))}
                            </Combobox.Options>
                        </Combobox.Dropdown>
                    </Combobox>
                    <TextInput
                        label="Language"
                        value={streamInfo.language}
                        onChange={(e) => setStreamInfo(prev => ({ ...prev, language: e.target.value }))}
                        mb="md"
                    />
                    <NumberInput
                        label="Delay (seconds)"
                        value={streamInfo.delay}
                        onChange={(value: number | string) => setStreamInfo(prev => ({ ...prev, delay: typeof value === 'string' ? parseInt(value) || 0 : value }))}
                        mb="md"
                        min={0}
                    />
                    <MultiSelect
                        label="Tags"
                        value={streamInfo.tags}
                        onChange={(value) => setStreamInfo(prev => ({ ...prev, tags: value }))}
                        data={[]}
                        searchable
                        mb="md"
                    />
                    <Switch
                        label="Branded Content"
                        checked={streamInfo.isBrandedContent}
                        onChange={(e) => setStreamInfo(prev => ({ ...prev, isBrandedContent: e.currentTarget.checked }))}
                        mb="md"
                    />
                    <MultiSelect
                        disabled
                        label="Content Classification Labels"
                        value={streamInfo.contentClassificationLabels}
                        onChange={(value) => setStreamInfo(prev => ({ ...prev, contentClassificationLabels: value }))}
                        data={classificationLabels}
                        searchable
                        mb="xl"
                    />
                    <Group justify="flex-end">
                        <Button type="submit" variant="gradient" radius={"lg"}>Save Changes</Button>
                    </Group>
                </form>
            </nav>
         </ScrollArea>
    );
}
