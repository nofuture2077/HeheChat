import { Title, Button, Card, Image, Group, Text, Badge, SimpleGrid } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useContext, useState } from 'react';
import { ChatConfigContext, LoginContext } from '@/ApplicationContext';
import { ApiClient, HelixStream } from '@twurple/api';
import classes from './twitchview.module.css'
import { Skeleton } from '@mantine/core';

function card(stream: HelixStream) {
    return (<Card key={stream.id} shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section>
            <Image
                src={stream.getThumbnailUrl(400, 280)}
                height={160}
                alt={stream.title}
            />
        </Card.Section>
        <Group justify="space-between" mb="xs"  mt="xs">
            <Text fw={500}>{stream.userName}</Text>
            <Badge color="pink">{stream.viewers}</Badge>
        </Group>
        <Text>
            {stream.gameName} - {stream.title}
        </Text>
    </Card>);
}

function cardPlaceholder() {
    return (<Card key='skeleton' shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section>
            <Skeleton h={160} w='100%'/>
        </Card.Section>
        <Group justify="space-between" mb="xs"  mt="xs">
            <Skeleton h={24}/>
        </Group>
        <Text>
        <Skeleton h={24}/>
        </Text>
    </Card>);
}

export function TwitchView(props: { close: () => void }) {
    const chatConfig = useContext(ChatConfigContext);
    const login = useContext(LoginContext);
    const [streams, setStreams] = useState<HelixStream[]>([]);

    const authProvider = login.getAuthProvider();
    const apiClient = new ApiClient({authProvider});

    apiClient.streams.getStreams({userName: chatConfig.channels}).then((data) => {
        setStreams(data.data);
    });

    return (<nav className={classes.navbar}>
        <div className={classes.header}>
            <Title order={4}>
                Twitch Streams
            </Title>
            <Button onClick={props.close} variant='subtle' color='primary'>
                <IconX />
            </Button>
        </div>
        <div className={classes.main}>
            <SimpleGrid className={classes.streams} cols={{ base: 1, sm: 2 }} m={10}>
                {streams.length === 0 ? cardPlaceholder() : null}
                {streams.map(stream => card(stream))}
            </SimpleGrid>
        </div>
    </nav>);
}