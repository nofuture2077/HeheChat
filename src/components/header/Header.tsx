import { Container, ActionIcon, Button, Text, Stack, Indicator } from '@mantine/core';
import { useDisclosure, useInterval } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconBrandTwitch, IconSettings, IconBell, IconKeyboard } from '@tabler/icons-react';
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
    openProfileBar: () => void,
    toggleShortcuts: () => void,
    showShortcutsToggle: boolean,
    currentClipId: string | null,
    setCurrentClipId: (currentClipId: string | null) => void,
}) {
    const config = useContext(ConfigContext);
    const [opened] = useDisclosure(false);
    const profile = useContext(ProfileContext);
    const [alertsActive, setAlertsActive] = useState<boolean>(false);

    const interval = useInterval(() => {
        const active = AlertSystem.status();
        setAlertsActive(active);
    }, 5 * 1000);

    useEffect(() => {
        interval.start();

        const clipSub = PubSub.subscribe("CLIP-CLICK", (msg: any, data: { clipId: string }) => {
            props.setCurrentClipId(data.clipId);
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
                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={() => props.openSettings()}>
                        <IconSettings />
                    </ActionIcon>
                    {props.showShortcutsToggle ? 
                        (<ActionIcon variant='transparent' color='primary' onClick={props.toggleShortcuts}  size='44px'>
                            <IconKeyboard/>
                        </ActionIcon>)
                    : null}

                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={props.openEvents}>
                        <Indicator size={8} offset={2} color={alertsActive ? 'green' : 'red'} processing={!alertsActive} disabled={!config.playAlerts}>
                            <IconBell  />
                        </Indicator>
                    </ActionIcon>
                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={props.openTwitch}>
                        <IconBrandTwitch/>
                    </ActionIcon>
                </div>
            </Container>
            {props.currentClipId ? <TwitchClipsPlayer clipId={props.currentClipId} onClose={() => props.setCurrentClipId(null)}/> : config.showVideo ? (<Container p={0}>
                <TwitchPlayer/>
            </Container>): null}
        </Stack>
    );
}
