import { useState, useContext } from 'react';
import { UnstyledButton, Tooltip, Title, rem, Button, Group } from '@mantine/core';
import {
  IconHome2,
  IconX,
  IconMessageChatbot
} from '@tabler/icons-react';
import classes from './settings.module.css';
import { ChatSettings } from './ChatSettings';
import { UISettings } from './UISettings';
import { UserButton } from '../commons/userbutton';
import { LoginContext } from '@/ApplicationContext';

const mainLinksMockdata = [
  { icon: IconHome2, label: 'UI' },
  { icon: IconMessageChatbot, label: 'Chat' }
];

export function Settings(props: {close: () => void}) {
  const [active, setActive] = useState('Chat');
  const loginContext = useContext(LoginContext);

  const mainLinks = mainLinksMockdata.map((link) => (
    <Tooltip
      label={link.label}
      position="right"
      withArrow
      transitionProps={{ duration: 0 }}
      key={link.label}
    >
      <UnstyledButton
        onClick={() => setActive(link.label)}
        className={classes.mainLink}
        data-active={link.label === active || undefined}
      >
        <link.icon style={{ width: rem(22), height: rem(22) }} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  ));

  const renderSwitch = (param: string) => {
    switch(param) {
    case 'UI':
        return <UISettings/>;
    case 'Chat':
        return <ChatSettings/>;
    default:
        return null;
    }
  }

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Title order={4}>
            {active}
        </Title>
        <Button onClick={props.close} variant='subtle' color='primary'>
            <IconX/>
        </Button>
      </div>
      <div className={classes.wrapper}>
        <div className={classes.aside}>
          <div className={classes.logo}>
          </div>
          {mainLinks}
        </div>
        <div className={classes.main}>          
            <div className={classes.active}>
                {renderSwitch(active)}
            </div>
        </div>
      </div>
      <div className={classes.footer}>
        <UserButton avatarUrl={loginContext.user?.profilePictureUrl || ''} name={loginContext.user?.displayName || ''} text={loginContext.user?.description || ''}/>
    </div>
    </nav>
  );
}