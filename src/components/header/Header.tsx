import { Container, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconBrandTwitch, IconSettings, IconBell, IconUserCode } from '@tabler/icons-react';
import Logo from '../../favicon.svg';

export function Header(props: {
    openSettings: () => void,
    openAlerts: () => void,
    openTwitch: () => void,
    openProfileBar: () => void
}) {
  const [opened] = useDisclosure(false);

  return (
    <Container className={classes.inner}>
        <div className={classes.logo}>
            <ActionIcon variant='transparent' color='primary' size={46}>
                <IconUserCode style={{ width: "32px", height: "32px" }} onClick={props.openProfileBar} size={42}/>
            </ActionIcon>
        </div>
        <div></div>
        <div className={classes.rightGroup}>
            <ActionIcon variant='transparent' color='primary' size={46}>
                <IconSettings style={{ width: "32px", height: "32px" }} onClick={props.openSettings} size={42}/>
            </ActionIcon>
            <ActionIcon variant='transparent' color='primary' size={46}>
                <IconBell style={{ width: "32px", height: "32px" }} onClick={props.openAlerts} size={42}/>
            </ActionIcon>
            <ActionIcon variant='transparent' color='primary' size={46}>
                <IconBrandTwitch style={{ width: "32px", height: "32px" }} onClick={props.openTwitch} size={42}/>
            </ActionIcon>
        </div>
    </Container>
  );
}