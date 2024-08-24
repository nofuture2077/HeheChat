import { useState, useContext } from 'react';
import { UnstyledButton, Tooltip, Title, rem, Button, Box, Avatar } from '@mantine/core';
import {
  IconHome2,
  IconX,
  IconMessageChatbot,
  IconSword,
  IconChevronRight
} from '@tabler/icons-react';
import classes from './settings.module.css';
import { ChatSettings } from './ChatSettings';
import { UISettings } from './UISettings';
import { ModSettings } from './ModSettings';
import { InfoCard } from '../infocard/infocard';
import { LoginContextContext } from '@/ApplicationContext';

const mainLinksMockdata = [
  { icon: IconHome2, label: 'General' },
  { icon: IconMessageChatbot, label: 'Chat' },
  { icon: IconSword, label: 'Mod' }
];

export interface SettingsProperties {
  close: () => void,
  openProfileBar: () => void
}

export function Settings(props: SettingsProperties) {
  const [active, setActive] = useState('General');
  const loginContext = useContext(LoginContextContext);

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
    switch (param) {
      case 'General':
        return <UISettings close={props.close} openProfileBar={props.openProfileBar}/>;
      case 'Chat':
        return <ChatSettings />;
      case 'Mod':
        return <ModSettings />;
      default:
        return null;
    }
  }

  return (
    <nav className={classes.navbar} style={{overflow: 'hidden'}}>
      <div className={classes.header}>
        <Title order={4}>
          {active}
        </Title>
        <Button onClick={props.close} variant='subtle' color='primary'>
          <IconX />
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
        <InfoCard date={0} component={Box} name={loginContext.user?.displayName || ''} text={loginContext.user?.description || ''} left={<Avatar src={loginContext.user?.profilePictureUrl || ''} radius="xl"/>} right={<IconChevronRight/>}/>
      </div>
    </nav>
  );
}