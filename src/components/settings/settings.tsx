import { useState, useContext } from 'react';
import { UnstyledButton, Tooltip, Title, rem, Button, Avatar, ScrollArea } from '@mantine/core';
import {
  IconHome2,
  IconX,
  IconMessageChatbot,
  IconSword,
  IconChevronRight,
  IconBell,
  IconShare,
  IconKeyboard,
  IconUserUp,
  IconCrown,
  IconBrandDiscord,
  IconSwitchHorizontal
} from '@tabler/icons-react';
import classes from './settings.module.css';
import { ChatSettings } from './ChatSettings';
import { UISettings } from './UISettings';
import { ModSettings } from './ModSettings';
import { InfoCard } from '../infocard/infocard';
import { LoginContextContext, PremiumContext } from '@/ApplicationContext';
import { AlertSettings } from './AlertSettings';
import { ConnectSettings } from './ConnectSettings';
import { ShortcutSettings } from './ShortcutSettings';
import { NotificationSettings } from './NotificationSettings';
import { OverlayDrawer } from '@/pages/Chat.page';
import { PremiumSettings } from '../premium';
import { DiscordInfo } from './DiscordInfo';
import { SwitcherSettings } from './SwitcherSettings';

const mainLinksMockdata = [
  { icon: IconHome2, label: 'General' },
  { icon: IconMessageChatbot, label: 'Chat' },
  { icon: IconSword, label: 'Mod' },
  { icon: IconBell, label: 'Alerts' },
  { icon: IconShare, label: 'Connect' },
  { icon: IconKeyboard, label: 'Shortcuts' },
  { icon: IconUserUp, label: 'Notifications' },
  { icon: IconSwitchHorizontal, label: 'Switcher' },
  { icon: IconCrown, label: 'Premium' },
  { icon: IconBrandDiscord, label: 'Discord' },
];

export const SettingsDrawer: OverlayDrawer = {
  name: 'settings',
  component: Settings,
  size: 440,
  position: 'right',
}

export type SettingsTab = 'General' | 'Chat' | 'Mod' | 'Alerts' | 'Notifications' | 'Connect' | 'Shortcuts' | 'Switcher' | 'Premium' | 'Discord';

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
      case 'Notifications':
        return <NotificationSettings />;
      case 'Connect':
        return <ConnectSettings />;
      case 'Shortcuts':
        return <ShortcutSettings />;
      case 'Switcher':
        return <SwitcherSettings />;
      case 'Premium':
        return <PremiumSettings />;
      case 'Discord':
        return <DiscordInfo />;
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
        <InfoCard onClick={props.openUserProfile} showPremium={true} date={0} name={loginContext.user?.displayName || ''} text={loginContext.user?.description || ''} left={<Avatar src={loginContext.user?.profilePictureUrl || ''} radius="xl"/>} right={<IconChevronRight/>}/>
      </div>
    </nav>
  );
}
