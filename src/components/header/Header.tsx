import { Container, ActionIcon, Button, Text, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconBrandTwitch, IconSettings, IconBell, IconKeyboard, IconBroadcast } from '@tabler/icons-react';
import { useContext, useEffect } from 'react';
import { ConfigContext, ProfileContext, PremiumContext, LoginContextContext } from '@/ApplicationContext';
import { SettingsTab } from '@/components/settings/settings';
import { HeaderLogo } from './HeaderLogo';
import { TwitchPlayer } from '@/components/twitch/twitchplayer'
import { TwitchClipsPlayer } from '@/components/twitch/twitchclipsplayer';
import { AlertStatusIndicator } from '../alerts/AlertStatusIndicator';
import { BitrateIndicator } from '../switcher/BitrateIndicator';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { useConnectionStatus } from '@/commons/connectionStatus';

export function Header(props: {
    openSettings: (tab?: SettingsTab) => void,
    openEvents: () => void,
    openTwitch: () => void,
    openProfileBar: () => void,
    toggleShortcuts: () => void,
    showShortcutsToggle: boolean,
    currentClipId: string | null,
    setCurrentClipId: (currentClipId: string | null) => void
}) {
    const config = useContext(ConfigContext);
    const [opened] = useDisclosure(false);
    const profile = useContext(ProfileContext);
    const premium = useContext(PremiumContext);
    const loginContext = useContext(LoginContextContext);
    const connectionStatus = useConnectionStatus();
    
    useEffect(() => {
        const clipSub = PubSub.subscribe("CLIP-CLICK", (msg: any, data: { clipId: string }) => {
            props.setCurrentClipId(data.clipId);
        });

        return () => {
            PubSub.unsubscribe(clipSub);
        };
    }, []);

    return (
        <Stack gap={0}>
            <style>
                {`.mantine-Button-label {
                    overflow: visible;
                }`}
            </style>
            <Container className={classes.inner}>
                
                <Button fw={300} p={0} style={{overflow: 'visible'}} variant='transparent' color='primary' size='lg' onClick={props.openProfileBar} leftSection={<HeaderLogo height={28}/>}>
                    
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Text fw={700}>HEHE</Text>
                            <Text fw={300}>Chat{premium.isPremium ? ' Pro' : ''}</Text>
                        </div>
                    
                </Button>
                
<div className={classes.rightGroup}>
                    
                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={() => props.openSettings()}>
                        <IconSettings />
                    </ActionIcon>
                    
                    {props.showShortcutsToggle ? 
                        (<ActionIcon variant='transparent' color='primary' onClick={props.toggleShortcuts} size='44px'>
                            <IconKeyboard/>
                        </ActionIcon>)
                    : null}

                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={props.openEvents}>
                        <AlertStatusIndicator>
                            <IconBell />
                        </AlertStatusIndicator>
                    </ActionIcon>
                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={connectionStatus.forceReconnect}>
                        <ConnectionStatusIndicator>
                            <IconBroadcast />
                        </ConnectionStatusIndicator>
                    </ActionIcon>
                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={props.openTwitch}>
                        <IconBrandTwitch/>
                    </ActionIcon>
                </div>
            </Container>
            {props.currentClipId ? <TwitchClipsPlayer clipId={props.currentClipId} onClose={() => props.setCurrentClipId(null)}/> : config.showVideo ? (<Container p={0}>
                <TwitchPlayer hideViewer={
                    loginContext.user && config.getChatChannel() === loginContext.user.name 
                        ? config.hideOwnViewers 
                        : config.hideViewers
                }/>
            </Container>): null}
        </Stack>
    );
}
