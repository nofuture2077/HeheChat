import { useState, useContext } from 'react';
import { Tooltip, UnstyledButton, Title, rem, Button, ScrollArea, Text, Stack, Group, Alert, Center, Switch } from '@mantine/core';
import {
  IconHome2,
  IconX,
  IconMessageChatbot,
  IconSword,
  IconBell,
  IconShare,
  IconKeyboard,
  IconUserUp,
  IconCrown,
  IconBrandDiscord,
  IconSwitchHorizontal,
  IconPalette,
  IconCalendarEvent,
  IconUsers,
  IconVolume,
  IconLink,
  IconPencil,
  IconFilter,
  IconRepeat,
  IconBrandYoutube,
  IconMusic,
  IconHeadphones,
  IconUser,
  IconVideo,
  IconDeviceTv,
  IconTicket,
  IconGift,
  IconSettings,
  IconList,
  IconKey,
  IconChevronLeft,
  IconChevronRight,
  IconRobot,
  IconInfoCircle,
  IconWifi,
} from '@tabler/icons-react';
import classes from './settings.module.css';
import { ModSettings } from './ModSettings';
import { PremiumContext, ConfigContext } from '@/ApplicationContext';
import { NotificationEnableSection, NotificationStreamStartSettings, NotificationChatMentionSettings } from './NotificationSettings';
import { OverlayDrawer } from '@/pages/Chat.page';
import { DiscordInfo } from './DiscordInfo';
import { ShortcutSettings } from './ShortcutSettings';

// General
import { GeneralUISettings } from './general/GeneralUISettings';
import { GeneralVideoSettings } from './general/GeneralVideoSettings';
import { GeneralAccountSettings } from './general/GeneralAccountSettings';
import { GeneralBotSettings } from './general/GeneralBotSettings';
import { GeneralProfileSettings } from './general/GeneralProfileSettings';
import { ProfileSelector } from '../profile/profilebar';

// Chat
import { ChatChannelsSettings, ChatTopSection } from './chat/ChatChannelsSettings';
import { ChatAppearanceSettings } from './chat/ChatAppearanceSettings';
import { ChatEventsSettings } from './chat/ChatEventsSettings';
import { ChatBrowserSourceSettings } from './chat/ChatBrowserSourceSettings';
import { Chat7TVSettings } from './chat/Chat7TVSettings';

// Alerts
import { AlertsAudioSettings, AlertSoundOutputSection } from './alerts/AlertsAudioSettings';
import { AlertsSharingSettings } from './alerts/AlertsSharingSettings';
import { AlertsActiveSettings } from './alerts/AlertsActiveSettings';
import { AlertsEditorSettings } from './alerts/AlertsEditorSettings';
import { AlertsFiltersSettings } from './alerts/AlertsFiltersSettings';
import { AlertsRerollSettings } from './alerts/AlertsRerollSettings';

// Connect
import { ConnectElevenLabsSettings } from './connect/ConnectElevenLabsSettings';
import { ConnectSoundAlertsSettings } from './connect/ConnectSoundAlertsSettings';
import { ConnectBlerpSettings } from './connect/ConnectBlerpSettings';
import { ConnectStreamElementsSettings } from './connect/ConnectStreamElementsSettings';
import { ConnectPallySettings } from './connect/ConnectPallySettings';
import { ConnectKofiSettings } from './connect/ConnectKofiSettings';
import { ConnectFossabotSettings } from './connect/ConnectFossabotSettings';
import { ConnectYouTubeSettings } from './connect/ConnectYouTubeSettings';
import { ConnectStatusSettings } from './connect/ConnectStatusSettings';

// Switcher
import { ProviderConfigTab } from '../switcher/ProviderConfigTab';
import { RulesTab } from '../switcher/RulesTab';
import { TokenTab } from '../switcher/TokenTab';
import { PremiumRequired } from '../switcher/PremiumRequired';

// Premium
import { PremiumSettings } from '../premium/PremiumSettings';
import { DonationPremium } from '../premium/DonationPremium';
import { RedeemCode } from '../premium/RedeemCode';

export const SettingsDrawer: OverlayDrawer = {
  name: 'settings',
  component: Settings,
  size: 700,
  position: 'right',
}

export type SettingsTab =
  | 'General' | 'General/UI' | 'General/Account' | 'General/Profiles'
  | 'Chat' | 'Chat/Channels' | 'Chat/Appearance' | 'Chat/Events' | 'Chat/Bot' | 'Chat/BrowserSource' | 'Chat/SevenTV' | 'Chat/Video'
  | 'Mod'
  | 'Alerts' | 'Alerts/Audio' | 'Alerts/Sharing' | 'Alerts/ActiveAlerts' | 'Alerts/Editor' | 'Alerts/Filters' | 'Alerts/Reroll'
  | 'Notifications' | 'Notifications/StreamStart' | 'Notifications/ChatMention'
  | 'Connect' | 'Connect/ElevenLabs' | 'Connect/SoundAlerts' | 'Connect/Blerp'
  | 'Connect/StreamElements' | 'Connect/Pally' | 'Connect/Kofi' | 'Connect/Fossabot' | 'Connect/YouTube'
  | 'Shortcuts'
  | 'Switcher' | 'Switcher/Provider' | 'Switcher/Rules' | 'Switcher/Tokens'
  | 'Premium' | 'Premium/Donate' | 'Premium/Redeem'
  | 'Discord';

export interface SettingsProperties {
  close: () => void;
  openUserProfile: () => void;
  tab?: SettingsTab;
}

type NavChild = {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

type NavGroup = {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  children?: NavChild[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'General', label: 'General', icon: IconHome2,
    children: [
      { id: 'General/Account', label: 'Account', icon: IconUser },
      { id: 'General/Profiles', label: 'Profiles', icon: IconUsers },
    ],
  },
  {
    id: 'Chat', label: 'Chat', icon: IconMessageChatbot,
    children: [
      { id: 'Chat/Appearance', label: 'Appearance', icon: IconPalette },
      { id: 'Chat/Events', label: 'Chat Events', icon: IconCalendarEvent },
      { id: 'Chat/SevenTV', label: '7TV', icon: IconSettings },
      { id: 'Chat/Channels', label: 'TTS', icon: IconUsers },
      { id: 'Chat/Video', label: 'Video Player', icon: IconDeviceTv },
      { id: 'Chat/Bot', label: 'Bot', icon: IconRobot },
      { id: 'Chat/BrowserSource', label: 'Browser Source', icon: IconLink },
    ],
  },
  {
    id: 'Alerts', label: 'Alerts', icon: IconBell,
    children: [
      { id: 'Alerts/Editor', label: 'Editor', icon: IconPencil },
      { id: 'Alerts/ActiveAlerts', label: 'Active Alerts', icon: IconBell },
      { id: 'Alerts/Audio', label: 'Audio', icon: IconVolume },
      { id: 'Alerts/Filters', label: 'Sidebar', icon: IconFilter },
      { id: 'Alerts/Sharing', label: 'Sharing', icon: IconShare },
      { id: 'Alerts/Reroll', label: 'Reroll', icon: IconRepeat },
    ],
  },
  {
    id: 'Connect', label: 'Connect', icon: IconLink,
    children: [
      { id: 'Connect/YouTube', label: 'YouTube', icon: IconBrandYoutube },
      { id: 'Connect/ElevenLabs', label: 'ElevenLabs', icon: IconHeadphones },
      { id: 'Connect/SoundAlerts', label: 'SoundAlerts', icon: IconVolume },
      { id: 'Connect/Blerp', label: 'Blerp', icon: IconMusic },
      { id: 'Connect/StreamElements', label: 'StreamElements', icon: IconShare },
      { id: 'Connect/Pally', label: 'Pally.gg', icon: IconGift },
      { id: 'Connect/Kofi', label: 'Ko-fi', icon: IconGift },
      { id: 'Connect/Fossabot', label: 'Fossabot', icon: IconSettings },
    ],
  },
  { id: 'Shortcuts', label: 'Shortcuts', icon: IconKeyboard },
  {
    id: 'Switcher', label: 'OBS Remote', icon: IconSwitchHorizontal,
    children: [
      { id: 'Switcher/Provider', label: 'Provider', icon: IconSettings },
      { id: 'Switcher/Rules', label: 'Rules', icon: IconList },
      { id: 'Switcher/Tokens', label: 'Browsersource', icon: IconKey },
    ],
  },
  { id: 'Mod', label: 'Mod', icon: IconSword },
  {
    id: 'Notifications', label: 'Notifications', icon: IconUserUp,
    children: [
      { id: 'Notifications/StreamStart', label: 'Stream Start', icon: IconBell },
      { id: 'Notifications/ChatMention', label: 'Chat Mention', icon: IconMessageChatbot },
    ],
  },
  {
    id: 'Premium', label: 'Premium', icon: IconCrown,
    children: [
      { id: 'Premium/Donate', label: 'Donate', icon: IconGift },
      { id: 'Premium/Redeem', label: 'Redeem', icon: IconTicket },
    ],
  },
  { id: 'Discord', label: 'Discord', icon: IconBrandDiscord },
];

function getParentGroup(tab: SettingsTab): NavGroup | undefined {
  return NAV_GROUPS.find(g => g.id === tab || g.children?.some(c => c.id === tab));
}

function resolveInitialTab(tab?: SettingsTab): SettingsTab {
  if (!tab) return 'General';
  return tab;
}

const tabLabels: Partial<Record<SettingsTab, string>> = {
  'General': 'General',
  'General/UI': 'General › UI',
  'Chat/Video': 'Chat › Video Player',
  'General/Account': 'General › Account',
  'General/Profiles': 'General › Profiles',
  'Chat': 'Chat',
  'Chat/Channels': 'Chat › TTS',
  'Chat/Appearance': 'Chat › Appearance',
  'Chat/Events': 'Chat › Chat Events',
  'Chat/Bot': 'Chat › Bot',
  'Chat/BrowserSource': 'Chat › Browser Source',
  'Chat/SevenTV': 'Chat › 7TV',
  'Mod': 'Mod',
  'Alerts': 'Alerts',
  'Alerts/Audio': 'Alerts › Audio',
  'Alerts/Sharing': 'Alerts › Sharing',
  'Alerts/ActiveAlerts': 'Alerts › Active Alerts',
  'Alerts/Editor': 'Alerts › Editor',
  'Alerts/Filters': 'Alerts › Filters',
  'Alerts/Reroll': 'Alerts › Reroll',
  'Notifications': 'Notifications',
  'Notifications/StreamStart': 'Notifications › Stream Start',
  'Notifications/ChatMention': 'Notifications › Chat Mention',
  'Connect': 'Connect',
  'Connect/ElevenLabs': 'Connect › ElevenLabs',
  'Connect/SoundAlerts': 'Connect › SoundAlerts',
  'Connect/Blerp': 'Connect › Blerp',
  'Connect/StreamElements': 'Connect › StreamElements',
  'Connect/Pally': 'Connect › Pally.gg',
  'Connect/Kofi': 'Connect › Ko-fi',
  'Connect/Fossabot': 'Connect › Fossabot',
  'Connect/YouTube': 'Connect › YouTube',
  'Shortcuts': 'Shortcuts',
  'Switcher': 'OBS Remote',
  'Switcher/Provider': 'OBS Remote › Provider',
  'Switcher/Rules': 'OBS Remote › Rules',
  'Switcher/Tokens': 'OBS Remote › Browsersource',
  'Premium': 'Premium',
  'Premium/Donate': 'Premium › Donate',
  'Premium/Redeem': 'Premium › Redeem',
  'Discord': 'Discord',
};

export function Settings(props: SettingsProperties) {
  const [active, setActive] = useState<SettingsTab>(resolveInitialTab(props.tab));
  const [premiumRefreshKey, setPremiumRefreshKey] = useState(0);
  const premium = useContext(PremiumContext);
  const config = useContext(ConfigContext);

  const nav = (tab: SettingsTab) => setActive(tab);

  const activeGroup = getParentGroup(active);
  const isSubMenu = activeGroup?.id === active && !!activeGroup?.children?.length;

  const renderPinnedContent = (groupId: SettingsTab) => {
    switch (groupId) {
      case 'General':
        return (
          <GeneralUISettings />
        );
      case 'Chat':
        return <ChatTopSection />;
      case 'Notifications':
        return <NotificationEnableSection />;
      case 'Alerts':
        return <AlertSoundOutputSection />;
      case 'Switcher':
        return (
          <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
            OBS Remote / Scene Switcher automatically switches OBS scenes based on your stream's health metrics (bitrate, RTT). It connects to your stream ingest provider and OBS WebSocket to react to stream state changes in real time. Requires Premium.
          </Alert>
        );
      case 'Connect':
        return <ConnectStatusSettings />;
      case 'Premium':
        return <PremiumSettings refreshKey={premiumRefreshKey} />;
      default:
        return null;
    }
  };

  const renderSubMenuFooter = (groupId: SettingsTab) => {
    switch (groupId) {
      case 'General':
        return (
          <Center>
            <Switch checked={config.rainMode} onChange={(event) => config.setRainMode(event.currentTarget.checked)} label="Rain Mode" size="lg" />
          </Center>
        );
      default:
        return null;
    }
  };

  const renderSubMenu = (group: NavGroup) => {
    const pinned = renderPinnedContent(group.id);
    return (
      <Stack gap="xl" p="lg">
        {pinned}
        <Stack gap="xs">
          {group.children!.map(child => {
            const ChildIcon = child.icon;
            return (
              <UnstyledButton
                key={child.id}
                className={classes.subMenuCard}
                onClick={() => nav(child.id)}
              >
                <Group gap="sm" justify="space-between">
                  <Group gap="sm">
                    <ChildIcon size={18} />
                    <Text size="sm" fw={500}>{child.label}</Text>
                  </Group>
                  <IconChevronRight size={16} />
                </Group>
              </UnstyledButton>
            );
          })}
        </Stack>
        {renderSubMenuFooter(group.id)}
      </Stack>
    );
  };

  const renderContentHeader = () => {
    if (!activeGroup || activeGroup.id === active) return null;
    return (
      <Group mb="sm" mt="sm">
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconChevronLeft size={14} />}
          onClick={() => nav(activeGroup.id)}
        >
          {activeGroup.label}
        </Button>
      </Group>
    );
  };

  const renderContentBody = () => {
    switch (active) {
      case 'Chat/Video': return <GeneralVideoSettings />;
      case 'General/Account': return <GeneralAccountSettings close={props.close} openUserProfile={props.openUserProfile} />;
      case 'General/Profiles': return (
        <Stack mt={30} mb={30} gap={30}>
          <GeneralProfileSettings />
          <ProfileSelector onCreateProfileRequested={() => nav('Chat')} />
        </Stack>
      );
      case 'Chat/Channels': return <ChatChannelsSettings />;
      case 'Chat/Appearance': return <ChatAppearanceSettings />;
      case 'Chat/Events': return <ChatEventsSettings />;
      case 'Chat/Bot': return <Stack mt={30} mb={30} gap={30}><GeneralBotSettings /></Stack>;
      case 'Chat/BrowserSource': return <ChatBrowserSourceSettings />;
      case 'Chat/SevenTV': return <Chat7TVSettings />;
      case 'Mod': return <ModSettings />;
      case 'Alerts/Audio': return <AlertsAudioSettings />;
      case 'Alerts/Sharing': return <AlertsSharingSettings />;
      case 'Alerts/ActiveAlerts': return <AlertsActiveSettings />;
      case 'Alerts/Editor': return <AlertsEditorSettings />;
      case 'Alerts/Filters': return <AlertsFiltersSettings />;
      case 'Alerts/Reroll': return <AlertsRerollSettings />;
      case 'Notifications/StreamStart': return <NotificationStreamStartSettings />;
      case 'Notifications/ChatMention': return <NotificationChatMentionSettings />;
      case 'Connect/ElevenLabs': return <ConnectElevenLabsSettings />;
      case 'Connect/SoundAlerts': return <ConnectSoundAlertsSettings />;
      case 'Connect/Blerp': return <ConnectBlerpSettings />;
      case 'Connect/StreamElements': return <ConnectStreamElementsSettings />;
      case 'Connect/Pally': return <ConnectPallySettings />;
      case 'Connect/Kofi': return <ConnectKofiSettings />;
      case 'Connect/Fossabot': return <ConnectFossabotSettings />;
      case 'Connect/YouTube': return <ConnectYouTubeSettings />;
      case 'Shortcuts': return <ShortcutSettings />;
      case 'Switcher/Provider': return (
        <Stack mt={30} mb={30} gap={30}>
          <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
            Configure your stream ingest provider (e.g. nginx-rtmp, SRT server). HeheChat monitors the incoming stream signal from this provider to detect when your stream goes online or offline and trigger scene switches automatically. Scene switching on stream stop requires the HeheChat Browser Source to be added as a source in OBS (see Chat › Browser Source for the URL).
          </Alert>
          {premium.isPremium ? <ProviderConfigTab /> : <PremiumRequired />}
        </Stack>
      );
      case 'Switcher/Rules': return (
        <Stack mt={30} mb={30} gap={30}>
          <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
            Rules define which OBS scene to switch to based on stream metrics like bitrate or RTT. For example: switch to a "Low Bitrate" scene when bitrate drops below a threshold, or switch to "Starting Soon" when the stream goes offline. Rules that trigger on stream stop require the HeheChat Browser Source to be added as a source in OBS (see Chat › Browser Source for the URL).
          </Alert>
          {premium.isPremium ? <RulesTab /> : <PremiumRequired />}
        </Stack>
      );
      case 'Switcher/Tokens': return (
        <Stack mt={30} mb={30} gap={30}>
          <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
            Add this page as a Browser Source in OBS to enable automatic scene switching. Enter your OBS WebSocket URL and password, then copy the generated URL and paste it into an OBS Browser Source.
          </Alert>
          {premium.isPremium ? <TokenTab /> : <PremiumRequired />}
        </Stack>
      );
      case 'Premium/Donate': return <DonationPremium />;
      case 'Premium/Redeem': return <RedeemCode onSuccess={() => { setPremiumRefreshKey(k => k + 1); setActive('Premium'); }} />;
      case 'Discord': return <DiscordInfo />;
      default: return null;
    }
  };

  const renderContent = () => {
    if (isSubMenu && activeGroup) {
      return renderSubMenu(activeGroup);
    }
    return (
      <>
        {renderContentHeader()}
        {renderContentBody()}
      </>
    );
  };

  return (
    <nav className={classes.navbar} style={{ overflow: 'hidden' }}>
      <div className={classes.header}>
        <Text fw={700} c='primary'>Settings › {tabLabels[active] ?? active}</Text>
        <Button onClick={props.close} variant='subtle' color='primary'><IconX /></Button>
      </div>
      <div className={classes.wrapper}>
        <div className={classes.aside}>
          {NAV_GROUPS.map(group => {
            const Icon = group.icon;
            const isGroupActive = active === group.id || active.startsWith(group.id + '/');
            return (
              <Tooltip key={group.id} label={group.label} position="right" withArrow>
                <UnstyledButton
                  className={classes.iconNavItem}
                  data-active={isGroupActive || undefined}
                  onClick={() => nav(group.id)}
                >
                  <Icon size={20} />
                </UnstyledButton>
              </Tooltip>
            );
          })}
        </div>
        <div className={classes.main}>
          <ScrollArea h="calc(100vh - 36px)" maw="100%" className={classes.active} scrollbars="y">
            {renderContent()}
          </ScrollArea>
        </div>
      </div>
    </nav>
  );
}
