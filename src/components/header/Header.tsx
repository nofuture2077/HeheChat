import { Container, ActionIcon, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconBrandTwitch, IconSettings, IconBell, IconUserCircle } from '@tabler/icons-react';
import { useContext } from 'react';
import { ProfileContext } from '@/ApplicationContext';
import { SettingsTab } from '@/components/settings/settings';
import { HeaderLogo } from './HeaderLogo';


export function Header(props: {
    openSettings: (tab?: SettingsTab) => void,
    openEvents: () => void,
    openTwitch: () => void,
    openProfileBar: () => void
}) {
    const [opened] = useDisclosure(false);
    const profile = useContext(ProfileContext);
    return (
        <Container className={classes.inner}>
            <Button fw={300} p={0} variant='transparent' color='primary' size='lg' onClick={props.openProfileBar} leftSection={<HeaderLogo height={28}/>}><Text fw={700}>HEHE</Text><Text fw={300}>Chat</Text></Button>
            <div></div>
            <div className={classes.rightGroup}>
                <ActionIcon variant='transparent' color='primary' size='44px'>
                    <IconSettings onClick={() => props.openSettings()} />
                </ActionIcon>
                <ActionIcon variant='transparent' color='primary' size='44px'>
                    <IconBell onClick={props.openEvents} />
                </ActionIcon>
                <ActionIcon variant='transparent' color='primary' size='44px'>
                    <IconBrandTwitch onClick={props.openTwitch}/>
                </ActionIcon>
            </div>
        </Container>
    );
}