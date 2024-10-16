import { Paper, Stack, Text, Badge, Group, Box, Skeleton, BackgroundImage, Anchor } from '@mantine/core';
import { HelixStream } from '@twurple/api';
import classes from './streamcard.module.css'

export function StreamCard(props: { stream: HelixStream, onClick?: (stream: HelixStream) => void }) {
    const stream = props.stream;
    return (<Anchor href={"https://twitch.tv/" + stream.userName} target='blank' className={classes.link}>
        <Paper shadow="sm" radius="md" withBorder>
            <Box>
                <BackgroundImage src={stream.getThumbnailUrl(320, 180)} radius="sm">
                    <Stack justify="space-between" flex={1} p='xs' gap='xs' h={180}>
                        <Group justify="space-between">
                            <Badge color="green">{stream.gameName}</Badge>
                            <Badge color="pink">{stream.viewers}</Badge>
                        </Group>
                        <Stack>
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