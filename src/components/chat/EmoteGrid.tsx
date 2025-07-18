import { useContext, useEffect, useState, useRef } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { Grid, Paper, Text, ScrollArea, ActionIcon, Flex } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { EmoteComponent } from '@/components/emote/emote';
import styles from './EmoteGrid.module.css';

interface EmoteGridProps {
    channel: string | null;
    searchText: string;
    onEmoteSelect: (emoteName: string) => void;
    emoteList: Map<string, any[]>;
    isManuallyOpen?: boolean;
    onClose?: () => void;
}

function getImageUrl(id: string, scale: number) {
    return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/${scale}.0`;
}

export function EmoteGrid({ channel, searchText, onEmoteSelect, emoteList, isManuallyOpen, onClose }: EmoteGridProps) {
    const [visible, setVisible] = useState(false);
    const config = useContext(ConfigContext);

    useEffect(() => {
        // Show grid if manually opened OR if search text is more than 2 characters (and emote dialog is not disabled)
        const shouldShow = isManuallyOpen || (searchText.length > 2 && !config.disableEmoteDialog);
        setVisible(shouldShow);
    }, [searchText, config.disableEmoteDialog, isManuallyOpen]);

    if (!visible || !channel || emoteList.size === 0) return null;

    return (
        <Paper 
            shadow="xl" 
            p="md" 
            className={styles.container}
        >
            {isManuallyOpen && onClose && (
                <Flex justify="flex-end" mb="sm">
                    <ActionIcon 
                        size="sm" 
                        variant="subtle" 
                        color="gray" 
                        onClick={onClose}
                    >
                        <IconX size={16} />
                    </ActionIcon>
                </Flex>
            )}
            <ScrollArea className={styles.scrollArea}>
                {Array.from(emoteList.entries()).map(([category, emotes]) => (
                    <div key={category}>
                        <Text size="sm" className={styles.categoryTitle}>{category}</Text>
                        <Grid gutter="md" className={styles.gridContainer}>
                            {emotes.map((emote: any, index: number) => (
                                <Grid.Col span={3} key={`${emote.name}-${index}`}>
                                    <div 
                                        className={styles.emoteContainer}
                                        onClick={() => onEmoteSelect(emote.name)}
                                    >
                                        <EmoteComponent
                                            imageUrl={emote.data?.host?.url ? `${emote.data.host.url}/${emote.data.host.files[1].name}` : emote.data?.getImageUrl ? emote.data?.getImageUrl(2) : getImageUrl(emote.data?.id, 2)}
                                            largeImageUrl={emote.data?.host?.url ? `${emote.data.host.url}/${emote.data.host.files[3].name}` : emote.data?.getImageUrl ? emote.data?.getImageUrl(4) : getImageUrl(emote.data?.id, 4)}
                                            name={emote.name}
                                            type={emote.type}
                                        />
                                    </div>
                                </Grid.Col>
                            ))}
                        </Grid>
                    </div>
                ))}
            </ScrollArea>
        </Paper>
    );
}
