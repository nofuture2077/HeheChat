import { Container, ActionIcon, Button, Text, Stack, Indicator } from '@mantine/core';
import { useDisclosure, useInterval } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconBrandTwitch, IconSettings, IconBell } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { ConfigContext, ProfileContext } from '@/ApplicationContext';
import { SettingsTab } from '@/components/settings/settings';
import { HeaderLogo } from './HeaderLogo';
import { TwitchPlayer } from '@/components/twitch/twitchplayer'
import { TwitchClipsPlayer } from '@/components/twitch/twitchclipsplayer';

import { AlertSystem } from '../alerts/alertplayer';


export function Header(props: {
    openSettings: (tab?: SettingsTab) => void,
    openEvents: () => void,
    openTwitch: () => void,
    openProfileBar: () => void
}) {
    const config = useContext(ConfigContext);
    const [opened] = useDisclosure(false);
    const profile = useContext(ProfileContext);
    const [alertsActive, setAlertsActive] = useState<boolean>(false);
    const [currentClipId, setCurrentClipId] = useState<string | null>(null);

    const interval = useInterval(() => {
        const active = AlertSystem.status();
        setAlertsActive(active);
    }, 5 * 1000);

    useEffect(() => {
        interval.start();

        const clipSub = PubSub.subscribe("CLIP-CLICK", (msg: any, data: { clipId: string }) => {
            setCurrentClipId(data.clipId);
        });

        return () => {
            PubSub.unsubscribe(clipSub);
            interval.stop();
        };
    });

    return (
        <Stack gap={0}>
            <Container className={classes.inner}>
                <Button fw={300} p={0} variant='transparent' color='primary' size='lg' onClick={props.openProfileBar} leftSection={<HeaderLogo height={28}/>}><Text fw={700}>HEHE</Text><Text fw={300}>Chat</Text></Button>
                <div></div>
                <div className={classes.rightGroup}>
                    <ActionIcon variant='transparent' color='primary' size='44px'>
                        <IconSettings onClick={() => props.openSettings()} />
                    </ActionIcon>
                    <ActionIcon variant='transparent' color='primary' size='44px'>
                        <Indicator size={8} offset={2} color={alertsActive ? 'green' : 'red'} processing={!alertsActive} disabled={!config.playAlerts}>
                            <IconBell onClick={props.openEvents} />
                        </Indicator>
                    </ActionIcon>
                    <ActionIcon variant='transparent' color='primary' size='44px'>
                        <IconBrandTwitch onClick={props.openTwitch}/>
                    </ActionIcon>
                </div>
            </Container>
            {currentClipId ? <TwitchClipsPlayer clipId={currentClipId} onClose={() => setCurrentClipId(null)}/> : config.showVideo ? (<Container p={0}>
                <TwitchPlayer/>
            </Container>): null}

        </Stack>
    );
}