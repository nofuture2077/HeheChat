import { Container, ActionIcon, Group, Text, Stack, Popover, UnstyledButton, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconBrandTwitch, IconSettings, IconBell, IconKeyboard, IconRefresh } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { ConfigContext, ProfileContext, PremiumContext, LoginContextContext } from '@/ApplicationContext';
import { SettingsTab } from '@/components/settings/settings';
import { HeaderLogo } from './HeaderLogo';
import { TwitchPlayer } from '@/components/twitch/twitchplayer'
import { TwitchClipsPlayer } from '@/components/twitch/twitchclipsplayer';
import { AlertStatusIndicator } from '../alerts/AlertStatusIndicator';
import { AlertSystem } from '../alerts/alertplayer';
import { BitrateIndicator } from '../switcher/BitrateIndicator';
import { useConnectionStatus, type ConnectionStateName } from '@/commons/connectionStatus';

function connectionColor(state: ConnectionStateName): string {
    switch (state) {
        case 'connected': return 'green';
        case 'connecting':
        case 'reconnecting': return 'yellow';
        case 'disconnected': return 'red';
    }
}

function connectionLabel(state: ConnectionStateName): string {
    switch (state) {
        case 'connected': return 'Connected';
        case 'connecting': return 'Connecting…';
        case 'reconnecting': return 'Reconnecting…';
        case 'disconnected': return 'Disconnected';
    }
}

function StatusRow(props: {
    label: string;
    sublabel: string;
    color: string;
    ok: boolean;
    loading?: boolean;
    onAction: () => void;
    actionLabel: string;
}) {
    return (
        <Group justify="space-between" px={4} py={2} style={{
            borderRadius: 6,
            background: props.ok ? 'transparent' : `var(--mantine-color-${props.color}-light)`,
        }}>
            <Group gap={8}>
                <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: `var(--mantine-color-${props.color}-6)`,
                }} />
                <Stack gap={0}>
                    <Text size="sm" fw={500}>{props.label}</Text>
                    <Text size="xs" c="dimmed">{props.sublabel}</Text>
                </Stack>
            </Group>
            <ActionIcon
                variant={props.ok ? 'subtle' : 'filled'}
                color={props.ok ? 'gray' : props.color}
                size="sm"
                loading={props.loading}
                onClick={props.onAction}
                title={props.actionLabel}
            >
                <IconRefresh size={12} />
            </ActionIcon>
        </Group>
    );
}

export function Header(props: {
    openSettings: (tab?: SettingsTab) => void,
    openEvents: () => void,
    openTwitch: () => void,
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
    const [popoverOpened, setPopoverOpened] = useState(false);

    useEffect(() => {
        const clipSub = PubSub.subscribe("CLIP-CLICK", (msg: any, data: { clipId: string }) => {
            props.setCurrentClipId(data.clipId);
        });

        return () => {
            PubSub.unsubscribe(clipSub);
        };
    }, []);

    const isConnected = connectionStatus.state === 'connected';
    const isBusy = connectionStatus.state === 'connecting' || connectionStatus.state === 'reconnecting';
    const [alertSystemRunning, setAlertSystemRunning] = useState(AlertSystem.status());
    useEffect(() => {
        const id = setInterval(() => setAlertSystemRunning(AlertSystem.status()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <Stack gap={0}>
            <style>
                {`.mantine-Button-label {
                    overflow: visible;
                }
                @keyframes hehePulse {
                    0% { box-shadow: 0 0 0 0 currentColor; }
                    70% { box-shadow: 0 0 0 6px transparent; }
                    100% { box-shadow: 0 0 0 0 transparent; }
                }`}
            </style>
            <Container className={classes.inner}>

                <Popover
                    opened={popoverOpened}
                    onChange={setPopoverOpened}
                    position="bottom-start"
                    shadow="md"
                    withinPortal
                >
                    <Popover.Target>
                        <UnstyledButton onClick={() => setPopoverOpened(o => !o)}>
                            <Group gap={8} align='center' style={{ overflow: 'visible', position: 'relative' }}>
                                <HeaderLogo height={28} />
                                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                    <Text fw={700} c='primary'>HEHE</Text>
                                    <Text fw={300} c='primary'>Chat{premium.isPremium ? ' Pro' : ''}</Text>
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: -2,
                                            right: -10,
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: `var(--mantine-color-${connectionColor(connectionStatus.state)}-6)`,
                                            boxShadow: isBusy ? `0 0 0 0 var(--mantine-color-${connectionColor(connectionStatus.state)}-6)` : undefined,
                                            animation: isBusy ? 'hehePulse 1.4s infinite' : undefined,
                                        }}
                                    />
                                </div>
                            </Group>
                        </UnstyledButton>
                    </Popover.Target>
                    <Popover.Dropdown style={{ minWidth: 200, padding: 0, background: 'transparent', border: 'none'}}>
                        <Stack gap={4} className='glass-panel' style={{padding: 10}}>
                            <StatusRow
                                label="Server"
                                sublabel={connectionLabel(connectionStatus.state)}
                                color={connectionColor(connectionStatus.state)}
                                ok={isConnected}
                                loading={isBusy}
                                onAction={() => connectionStatus.forceReconnect()}
                                actionLabel="Reconnect"
                            />
                            <StatusRow
                                label="Alert Player"
                                sublabel={alertSystemRunning ? 'Running' : 'Not running'}
                                color={alertSystemRunning ? 'green' : 'red'}
                                ok={alertSystemRunning}
                                onAction={() => AlertSystem.recover()}
                                actionLabel="Restart"
                            />
                            <Divider my={4} />
                            <Group justify="space-between" px={4}>
                                <Text size="sm" c="dimmed">Reload Page</Text>
                                <ActionIcon
                                    variant="filled"
                                    color="red"
                                    size="sm"
                                    onClick={() => window.location.reload()}
                                >
                                    <IconRefresh size={12} />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    </Popover.Dropdown>
                </Popover>

<div className={classes.rightGroup}>

                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={() => props.openSettings()}>
                        <IconSettings />
                    </ActionIcon>

                    {props.showShortcutsToggle ?
                        (<ActionIcon variant='transparent' color='primary' onClick={props.toggleShortcuts} size='44px'>
                            <IconKeyboard/>
                        </ActionIcon>)
                    : null}

                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={props.openTwitch}>
                        <IconBrandTwitch/>
                    </ActionIcon>

                    <ActionIcon variant='transparent' color='primary' size='44px' onClick={props.openEvents}>
                        <AlertStatusIndicator>
                            <IconBell />
                        </AlertStatusIndicator>
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
