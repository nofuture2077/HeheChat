import { useState } from 'react';
import { UnstyledButton, Tooltip, Title, rem, Button, Group } from '@mantine/core';
import {
  IconHome2,
  IconGauge,
  IconDeviceDesktopAnalytics,
  IconFingerprint,
  IconCalendarStats,
  IconUser,
  IconSettings,
  IconX,
  IconMessageChatbot
} from '@tabler/icons-react';
import classes from './settings.module.css';
import { ChatSettings } from './ChatSettings';
import { UISettings } from './UISettings';

const mainLinksMockdata = [
  { icon: IconHome2, label: 'UI' },
  { icon: IconMessageChatbot, label: 'Chat' }
];

export function Settings(props: {close: () => void}) {
  const [active, setActive] = useState('Chat');

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
      <div className={classes.wrapper}>
        <div className={classes.aside}>
          <div className={classes.logo}>
          </div>
          {mainLinks}
        </div>
        <div className={classes.main}>
            <Group className={classes.title} justify='space-between'>
                <Title order={4}>
                    {active}
                </Title>
                <Button onClick={props.close} variant='subtle' color='primary'>
                    <IconX/>
                </Button>
            </Group>
          
          <div className={classes.active}>
            {renderSwitch(active)}
          </div>
        </div>
      </div>
    </nav>
  );
}