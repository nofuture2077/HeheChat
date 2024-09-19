import { Title, Button, SimpleGrid, Tabs, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconX } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { HelixStream } from '@twurple/api';
import { StreamCardPlaceholder, StreamCard } from './streamcard';
import { RaidView } from '../chat/mod/modview';
import classes from './twitchview.module.css';
import { ModActions } from '../chat/mod/modactions'
import { OverlayDrawer } from '@/pages/Chat.page';

export const TwitchDrawer: OverlayDrawer = {
    name: 'twitch',
    component: TwitchView,
    size: 340,
    position: 'right'
}

export interface TwitchViewProps {
    close: () => void,
    modActions: ModActions,
}

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export function TwitchView(props: TwitchViewProps) {
    const config = useContext(ConfigContext);
    const login = useContext(LoginContextContext);
    const [streams, setStreams] = useState<HelixStream[]>([]);
    const [loadStream, setLoadStreams] = useState<boolean>(true);
    const [raidTargetStreams, setRaidTargetStreams] = useState<HelixStream[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('live');
    const [raidModalOpenend, raidModalHandler] = useDisclosure(false);
    const [initialRaidTarget, setInitialRaidTarget] = useState<string | undefined>();

    useEffect(() => {
        setLoadStreams(true);
        if (activeTab === 'live') {
            fetch(BASE_URL + "/twitch/streams?channels=" + config.channels.join(',')).then(res => res.json()).then((data) => {
                setStreams(data.map((d: any) => new HelixStream(d)));
                setLoadStreams(false);
            });
        }
        if (activeTab === 'raids') {
            fetch(BASE_URL + "/twitch/streams?channels=" + config.raidTargets.join(',')).then(res => res.json()).then((data) => {
                setStreams(data.map((d: any) => new HelixStream(d)));
                setLoadStreams(false);
            });
        }
    }, [activeTab]);

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
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="live">Live</Tabs.Tab>
                    <Tabs.Tab value="raids">Raids</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="live">
                    <SimpleGrid className={classes.streams} cols={{ base: 1, sm: 1 }} m={10}>
                        {loadStream ? [1, 2, 3].map((x) => (<StreamCardPlaceholder key={x} />)) : null}
                        {!loadStream && streams.length === 0 ? <Text pt='xl' size='xl' ta="center" fw={500}>No Streams right now.</Text> : null}
                        {streams.map(stream => (<StreamCard stream={stream} key={stream.id} />))}
                    </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="raids">
                    <SimpleGrid className={classes.streams} cols={{ base: 1, sm: 1 }} m={10}>
                        {loadStream ? [1, 2, 3].map((x) => (<StreamCardPlaceholder key={x} />)) : null}
                        {!loadStream && raidTargetStreams.length === 0 ? <Text pt='xl' size='xl' ta="center" fw={500}>No Streams for raid right now.</Text> : null}
                        {raidTargetStreams.map(stream => (<StreamCard stream={stream} key={stream.id} onClick={(stream) => {
                            setInitialRaidTarget(stream.userName);
                            raidModalHandler.open();
                        }}/>))}
                    </SimpleGrid>
                </Tabs.Panel>
            </Tabs>
            {raidModalOpenend ? <RaidView initialFrom={login.user?.name} initialTo={initialRaidTarget} raidChannel={props.modActions.raidUser} close={raidModalHandler.close}/> : null}
        </div>
    </nav>);
}