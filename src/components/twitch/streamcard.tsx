import { Paper, Flex, Image, Stack, Text, Badge, Group, Box, Skeleton } from '@mantine/core';
import { HelixStream } from '@twurple/api';
import classes from './streamcard.module.css'
import { Link } from 'react-router-dom';

const onClickOverrideLink = (stream: HelixStream, onClick?: (stream: HelixStream) => void) => {
    return (ev: any) => {
        if (onClick) {
            onClick(stream);
            ev.preventDefault();
            return false;
        }
    }
}

export function StreamCard(props: {stream: HelixStream, onClick?: (stream: HelixStream) => void}) {
    const stream = props.stream;
    return (<Link to={"https://twitch.tv/" + stream.userName} onClick={onClickOverrideLink(stream, props.onClick)} target='blank' className={classes.link}><Paper shadow="sm" radius="md" withBorder>
        <Flex>
            <Box miw={240} maw={320} flex={1}>
                <Image
                    w="100%"
                    src={stream.getThumbnailUrl(320, 180)}
                    alt={stream.title}
                />
            </Box>
            <Stack justify="flex-start" flex={1} p='xs' gap='xs'>
                <Group justify="space-between">
                    <Badge color="green">{stream.gameName}</Badge>
                    <Badge color="pink">{stream.viewers}</Badge>
                </Group>
                <Text fw={900}>{stream.userName}</Text>
                <Text lineClamp={2}>
                    {stream.title}
                </Text>

            </Stack>
        </Flex>
    </Paper></Link>);
}

export function StreamCardPlaceholder(props: {}) {
    return (<Paper shadow="sm" radius="md" withBorder>
        <Flex>
            <Box miw={160} maw={320} flex={0.8}>
                <Skeleton w='100%' height='100%'/>
            </Box>
            <Stack justify="flex-start" flex={1} p='xs' gap='xs'>
                <Group justify="space-between">
                    <Skeleton w={100} h='1rem'/>
                    <Skeleton w={50} h='1rem'/>
                </Group>
                <Skeleton h='1rem'/>
                <Skeleton h='1rem'/>
            </Stack>
        </Flex>
    </Paper>);
}