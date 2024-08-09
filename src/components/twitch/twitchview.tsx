import { Title, Button, SimpleGrid, Tabs } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconX } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { ApiClient, HelixStream } from '@twurple/api';
import { StreamCardPlaceholder, StreamCard } from './streamcard';
import { RaidView } from '../chat/mod/modview';
import classes from './twitchview.module.css';
import { ModActions } from '../chat/mod/modactions'

export interface TwitchViewProps {
    close: () => void,
    modActions: ModActions,
}


export function TwitchView(props: TwitchViewProps) {
    const config = useContext(ConfigContext);
    const login = useContext(LoginContextContext);
    const [streams, setStreams] = useState<HelixStream[]>([]);
    const [raidTargetStreams, setRaidTargetStreams] = useState<HelixStream[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('live');
    const [raidModalOpenend, raidModalHandler] = useDisclosure(false);
    const [initialRaidTarget, setInitialRaidTarget] = useState<string | undefined>();

    const authProvider = login.getAuthProvider();
    const apiClient = new ApiClient({ authProvider });

    useEffect(() => {
        if (activeTab === 'live') {
            apiClient.streams.getStreams({ userName: config.channels }).then((data) => {
                setStreams(data.data);
            });
        }
        if (activeTab === 'raids') {
            apiClient.streams.getStreams({ userName: config.raidTargets }).then((data) => {
                setRaidTargetStreams(data.data);
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
                        {streams.length === 0 ? [1, 2, 3].map((x) => (<StreamCardPlaceholder key={x} />)) : null}
                        {streams.map(stream => (<StreamCard stream={stream} key={stream.id} />))}
                    </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="raids">
                    <SimpleGrid className={classes.streams} cols={{ base: 1, sm: 1 }} m={10}>
                        {raidTargetStreams.length === 0 ? [1, 2, 3].map((x) => (<StreamCardPlaceholder key={x} />)) : null}
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