import { useState, useContext } from 'react';
import { UnstyledButton, Tooltip, Title, rem, Button, Box, Avatar, ScrollArea } from '@mantine/core';
import {
  IconHome2,
  IconX,
  IconMessageChatbot,
  IconSword,
  IconChevronRight,
  IconBell,
  IconShare,
  IconKeyboard
} from '@tabler/icons-react';
import classes from './settings.module.css';
import { ChatSettings } from './ChatSettings';
import { UISettings } from './UISettings';
import { ModSettings } from './ModSettings';
import { InfoCard } from '../infocard/infocard';
import { LoginContextContext } from '@/ApplicationContext';
import { AlertSettings } from './AlertSettings';
import { ShareSettings } from './ShareSettings';
import { ShortcutSettings } from './ShortcutSettings';
import { OverlayDrawer } from '@/pages/Chat.page';

const mainLinksMockdata = [
  { icon: IconHome2, label: 'General' },
  { icon: IconMessageChatbot, label: 'Chat' },
  { icon: IconSword, label: 'Mod' },
  { icon: IconBell, label: 'Alerts' },
  { icon: IconShare, label: 'Share' },
  { icon: IconKeyboard, label: 'Shortcuts' }
];

export const SettingsDrawer: OverlayDrawer = {
  name: 'settings',
  component: Settings,
  size: 440,
  position: 'left',
}

export type SettingsTab = 'General' | 'Chat' | 'Mod' | 'Alerts' | 'Share' | 'Shortcuts';

export interface SettingsProperties {
  close: () => void;
  openProfileBar: () => void;
  openUserProfile: () => void;
  tab?: SettingsTab;
}

export function Settings(props: SettingsProperties) {
  const [active, setActive] = useState(props.tab || 'General');
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
        onClick={() => setActive(link.label as SettingsTab)}
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
      case 'Alerts':
        return <AlertSettings />;
      case 'Share':
        return <ShareSettings />;
      case 'Shortcuts':
        return <ShortcutSettings />;
      default:
        return null;
    }
  }

  return (
    <nav className={classes.navbar} style={{overflow: 'hidden'}}>
      <div className={classes.header}>
        <Title order={4}>
          Settings - {active}
        </Title>
        <Button onClick={props.close} variant='subtle' color='primary'>
          <IconX />
        </Button>
      </div>
      <div className={classes.wrapper}>
        <div className={classes.aside}>
          <div>
            {mainLinks}
          </div>
        </div>
        <div className={classes.main}>
          <ScrollArea h="calc(100vh - 126px)" maw="100%" className={classes.active} scrollbars="y">
            {renderSwitch(active)}
          </ScrollArea>
        </div>
      </div>
      <div className={classes.footer}>
        <InfoCard onClick={props.openUserProfile} date={0} name={loginContext.user?.displayName || ''} text={loginContext.user?.description || ''} left={<Avatar src={loginContext.user?.profilePictureUrl || ''} radius="xl"/>} right={<IconChevronRight/>}/>
      </div>
    </nav>
  );
}
