import { Container, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import { IconMessageChatbot, IconSettings, IconBell } from '@tabler/icons-react';
import Logo from '../../favicon.svg';

export function Header(props: {
    openSettings: () => void,
    openAlerts: () => void
}) {
  const [opened] = useDisclosure(false);

  return (
    <Container className={classes.inner}>
        <div className={classes.logo}>
            <img src={Logo} height={32} /><h3>HEHE Chat</h3>
        </div>
        <div></div>
        <div className={classes.rightGroup}>
            <ActionIcon variant='transparent' color='primary' size={46}>
                <IconSettings style={{ width: "32px", height: "32px" }} onClick={props.openSettings} size={42}/>
            </ActionIcon>
            <ActionIcon variant='transparent' color='primary' size={46}>
                <IconBell style={{ width: "32px", height: "32px" }} onClick={props.openAlerts} size={42}/>
            </ActionIcon>
        </div>
    </Container>
  );
}