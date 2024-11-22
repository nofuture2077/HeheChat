import { Paper, Stack, Text, Badge, Group, Box, Skeleton, BackgroundImage, Anchor } from '@mantine/core';
import { HelixStream } from '@twurple/api';
import classes from './streamcard.module.css'
import { formatHoursMinute } from '@/commons/helper';

function formatElapsedTimeSinceStartedAt(startedAt: Date): string {
    const now = Date.now();
    const secondsElapsed = Math.floor((now - startedAt.getTime()) / 1000);
    
    return formatHoursMinute(secondsElapsed);
}

export interface StreamCardProps {
    stream: HelixStream;
    onClick?: (stream: HelixStream) => void;
    hideViewers: boolean;
}

export function StreamCard(props: StreamCardProps) {
    const stream = props.stream;
    return (<Anchor href={"https://twitch.tv/" + stream.userName} target='blank' className={classes.link}>
        <Paper shadow="sm" radius="md" withBorder>
            <Box>
                <BackgroundImage src={stream.getThumbnailUrl(320, 180)} radius="sm">
                    <Stack justify="space-between" flex={1} p='xs' gap='xs' h={180}>
                        <Group justify="space-between" align='flex-start'>
                            <Badge color="green">{stream.gameName}</Badge>
                            <Stack align='flex-end' gap={'xs'}>
                                <Badge color="pink">{formatElapsedTimeSinceStartedAt(stream.startDate)}</Badge>
                                {props.hideViewers ? null : <Badge color="pink">{stream.viewers}</Badge>}
                            </Stack>
                        </Group>
                        <Stack gap={'xs'}>
                            <Badge color="gray"><Text fw={900}>{stream.userName}</Text></Badge>
                            <Badge color="gray" w='100%' style={{overflow: 'hidden'}}>{stream.title}</Badge>
                        </Stack>
                    </Stack>
                </BackgroundImage>
            </Box>
        </Paper>
    </Anchor>);
}

export function StreamCardPlaceholder(props: {}) {
    return (<Paper shadow="sm" radius="md" withBorder>
        <Stack justify="space-between" flex={1} p='xs' gap='xs' h={180}>
            <Group justify="space-between">
                <Skeleton w={100} h='1rem' />
                <Skeleton w={50} h='1rem' />
            </Group>
            <Stack>
                <Skeleton h='1rem' />
                <Skeleton h='1rem' />
            </Stack>
        </Stack>
    </Paper>);
}