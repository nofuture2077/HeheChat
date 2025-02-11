import { useContext, useEffect, useState } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { Grid, Paper, Text, ScrollArea } from '@mantine/core';
import { EmoteComponent } from '@/components/emote/emote';
import styles from './EmoteGrid.module.css';

interface EmoteGridProps {
    channel: string | null;
    searchText: string;
    onEmoteSelect: (emoteName: string) => void;
    emoteList: Map<string, any[]>;
}

export function EmoteGrid({ channel, searchText, onEmoteSelect, emoteList }: EmoteGridProps) {
    const [visible, setVisible] = useState(false);
    const config = useContext(ConfigContext);

    useEffect(() => {
        // Only show grid if search text is more than 2 characters and emote dialog is not disabled
        setVisible(searchText.length > 2 && !config.disableEmoteDialog);
    }, [searchText, config.disableEmoteDialog]);

    if (!visible || !channel || emoteList.size === 0) return null;

    return (
        <Paper 
            shadow="xl" 
            p="md" 
            className={styles.container}
        >
        {Array.from(emoteList.entries()).map(([category, emotes]) => (
            <div key={category}>
                <Text size="sm" className={styles.categoryTitle}>{category}</Text>
                <Grid gutter="md" className={styles.gridContainer}>
                    {emotes.slice(0, 12).map((emote: any, index: number) => (
                        <Grid.Col span={3} key={`${emote.name}-${index}`}>
                            <div 
                                className={styles.emoteContainer}
                                onClick={() => onEmoteSelect(emote.name)}
                            >
                                <EmoteComponent
                                    imageUrl={emote.data?.host?.url ? `${emote.data.host.url}/${emote.data.host.files[1].name}` : emote.data?.getImageUrl(2)}
                                    largeImageUrl={emote.data?.host?.url ? `${emote.data.host.url}/${emote.data.host.files[3].name}` : emote.data?.getImageUrl(4)}
                                    name={emote.name}
                                    type={emote.type}
                                />
                            </div>
                        </Grid.Col>
                    ))}
                </Grid>
            </div>
        ))}
        </Paper>
    );
}
