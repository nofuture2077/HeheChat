import { Container, ActionIcon, Title, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconBrandTwitch, IconSettings, IconBell, IconUserCode } from '@tabler/icons-react';
import { useContext } from 'react';
import { ProfileContext } from '@/ApplicationContext';

export function Header(props: {
    openSettings: () => void,
    openAlerts: () => void,
    openTwitch: () => void,
    openProfileBar: () => void
}) {
    const [opened] = useDisclosure(false);
    const profile = useContext(ProfileContext);
    return (
        <Container className={classes.inner}>
            <Button variant='transparent' color='primary' size='lg' onClick={props.openProfileBar} leftSection={<IconUserCode style={{ width: "32px", height: "32px" }} size={42} />}>{profile.name}</Button>
            <div></div>
            <div className={classes.rightGroup}>
                <ActionIcon variant='transparent' color='primary' size={46}>
                    <IconSettings style={{ width: "32px", height: "32px" }} onClick={props.openSettings} size={42} />
                </ActionIcon>
                <ActionIcon variant='transparent' color='primary' size={46}>
                    <IconBell style={{ width: "32px", height: "32px" }} onClick={props.openAlerts} size={42} />
                </ActionIcon>
                <ActionIcon variant='transparent' color='primary' size={46}>
                    <IconBrandTwitch style={{ width: "32px", height: "32px" }} onClick={props.openTwitch} size={42} />
                </ActionIcon>
            </div>
        </Container>
    );
}