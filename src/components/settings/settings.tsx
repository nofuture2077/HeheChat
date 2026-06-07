import { useState, useContext } from 'react';
import { Tooltip, UnstyledButton, Title, rem, Button, ScrollArea, Text, Divider, Stack, Group } from '@mantine/core';
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
  IconHistory,
  IconSettings,
  IconList,
  IconKey,
  IconChevronLeft,
  IconChevronRight,
  IconRobot,
} from '@tabler/icons-react';
import classes from './settings.module.css';
import { ModSettings } from './ModSettings';
import { PremiumContext } from '@/ApplicationContext';
import { NotificationEnableSection, NotificationStreamStartSettings, NotificationChatMentionSettings } from './NotificationSettings';
import { OverlayDrawer } from '@/pages/Chat.page';
import { DiscordInfo } from './DiscordInfo';
import { ShortcutSettings } from './ShortcutSettings';

// General
import { GeneralUISettings } from './general/GeneralUISettings';
import { GeneralVideoSettings } from './general/GeneralVideoSettings';
import { GeneralAccountSettings } from './general/GeneralAccountSettings';
import { GeneralChannelsSection } from './general/GeneralChannelsSection';
import { GeneralBotSettings } from './general/GeneralBotSettings';
import { GeneralProfileSettings } from './general/GeneralProfileSettings';
import { ProfileSelector } from '../profile/profilebar';

// Chat
import { ChatChannelsSettings, ChatTopSection } from './chat/ChatChannelsSettings';
import { ChatAppearanceSettings } from './chat/ChatAppearanceSettings';
import { ChatEventsSettings } from './chat/ChatEventsSettings';
import { ChatBrowserSourceSettings } from './chat/ChatBrowserSourceSettings';

// Alerts
import { AlertsAudioSettings, AlertSoundOutputSection } from './alerts/AlertsAudioSettings';
import { AlertsSharingSettings } from './alerts/AlertsSharingSettings';
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

// Switcher
import { ProviderConfigTab } from '../switcher/ProviderConfigTab';
import { RulesTab } from '../switcher/RulesTab';
import { TokenTab } from '../switcher/TokenTab';
import { PremiumRequired } from '../switcher/PremiumRequired';

// Premium
import { PremiumDetails } from '../premium/PremiumDetails';
import { DonationPremium } from '../premium/DonationPremium';
import { RedeemCode } from '../premium/RedeemCode';

export const SettingsDrawer: OverlayDrawer = {
  name: 'settings',
  component: Settings,
  size: 700,
  position: 'right',
}

export type SettingsTab =
  | 'General' | 'General/UI' | 'General/Video' | 'General/Account' | 'General/Profiles'
  | 'Chat' | 'Chat/Channels' | 'Chat/Appearance' | 'Chat/Events' | 'Chat/Bot' | 'Chat/BrowserSource'
  | 'Mod'
  | 'Alerts' | 'Alerts/Audio' | 'Alerts/Sharing' | 'Alerts/Editor' | 'Alerts/Filters' | 'Alerts/Reroll'
  | 'Notifications' | 'Notifications/StreamStart' | 'Notifications/ChatMention'
  | 'Connect' | 'Connect/ElevenLabs' | 'Connect/SoundAlerts' | 'Connect/Blerp'
  | 'Connect/StreamElements' | 'Connect/Pally' | 'Connect/Kofi' | 'Connect/Fossabot' | 'Connect/YouTube'
  | 'Shortcuts'
  | 'Switcher' | 'Switcher/Provider' | 'Switcher/Rules' | 'Switcher/Tokens'
  | 'Premium' | 'Premium/Status' | 'Premium/Donate' | 'Premium/Redeem' | 'Premium/History'
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
      { id: 'General/Video', label: 'Video Player', icon: IconDeviceTv },
      { id: 'General/Account', label: 'Account', icon: IconUser },
      { id: 'General/Profiles', label: 'Profiles', icon: IconUsers },
    ],
  },
  {
    id: 'Chat', label: 'Chat', icon: IconMessageChatbot,
    children: [
      { id: 'Chat/Channels', label: 'TTS', icon: IconUsers },
      { id: 'Chat/Appearance', label: 'Appearance', icon: IconPalette },
      { id: 'Chat/Events', label: 'Events', icon: IconCalendarEvent },
      { id: 'Chat/Bot', label: 'Bot', icon: IconRobot },
      { id: 'Chat/BrowserSource', label: 'Browser Source', icon: IconLink },
    ],
  },
  { id: 'Mod', label: 'Mod', icon: IconSword },
  {
    id: 'Alerts', label: 'Alerts', icon: IconBell,
    children: [
      { id: 'Alerts/Audio', label: 'Audio', icon: IconVolume },
      { id: 'Alerts/Sharing', label: 'Sharing', icon: IconShare },
      { id: 'Alerts/Editor', label: 'Editor', icon: IconPencil },
      { id: 'Alerts/Filters', label: 'Filters', icon: IconFilter },
      { id: 'Alerts/Reroll', label: 'Reroll', icon: IconRepeat },
    ],
  },
  {
    id: 'Notifications', label: 'Notifications', icon: IconUserUp,
    children: [
      { id: 'Notifications/StreamStart', label: 'Stream Start', icon: IconBell },
      { id: 'Notifications/ChatMention', label: 'Chat Mention', icon: IconMessageChatbot },
    ],
  },
  {
    id: 'Connect', label: 'Connect', icon: IconLink,
    children: [
      { id: 'Connect/ElevenLabs', label: 'ElevenLabs', icon: IconHeadphones },
      { id: 'Connect/SoundAlerts', label: 'SoundAlerts', icon: IconVolume },
      { id: 'Connect/Blerp', label: 'Blerp', icon: IconMusic },
      { id: 'Connect/StreamElements', label: 'StreamElements', icon: IconShare },
      { id: 'Connect/Pally', label: 'Pally.gg', icon: IconGift },
      { id: 'Connect/Kofi', label: 'Ko-fi', icon: IconGift },
      { id: 'Connect/Fossabot', label: 'Fossabot', icon: IconSettings },
      { id: 'Connect/YouTube', label: 'YouTube', icon: IconBrandYoutube },
    ],
  },
  { id: 'Shortcuts', label: 'Shortcuts', icon: IconKeyboard },
  {
    id: 'Switcher', label: 'Switcher', icon: IconSwitchHorizontal,
    children: [
      { id: 'Switcher/Provider', label: 'Provider', icon: IconSettings },
      { id: 'Switcher/Rules', label: 'Rules', icon: IconList },
      { id: 'Switcher/Tokens', label: 'Tokens', icon: IconKey },
    ],
  },
  {
    id: 'Premium', label: 'Premium', icon: IconCrown,
    children: [
      { id: 'Premium/Status', label: 'Status', icon: IconCrown },
      { id: 'Premium/Donate', label: 'Donate', icon: IconGift },
      { id: 'Premium/Redeem', label: 'Redeem', icon: IconTicket },
      { id: 'Premium/History', label: 'History', icon: IconHistory },
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
  'General/Video': 'General › Video Player',
  'General/Account': 'General › Account',
  'General/Profiles': 'General › Profiles',
  'Chat': 'Chat',
  'Chat/Channels': 'Chat › TTS',
  'Chat/Appearance': 'Chat › Appearance',
  'Chat/Events': 'Chat › Events',
  'Chat/Bot': 'Chat › Bot',
  'Chat/BrowserSource': 'Chat › Browser Source',
  'Mod': 'Mod',
  'Alerts': 'Alerts',
  'Alerts/Audio': 'Alerts › Audio',
  'Alerts/Sharing': 'Alerts › Sharing',
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
  'Switcher': 'Switcher',
  'Switcher/Provider': 'Switcher › Provider',
  'Switcher/Rules': 'Switcher › Rules',
  'Switcher/Tokens': 'Switcher › Tokens',
  'Premium': 'Premium',
  'Premium/Status': 'Premium › Status',
  'Premium/Donate': 'Premium › Donate',
  'Premium/Redeem': 'Premium › Redeem',
  'Premium/History': 'Premium › History',
  'Discord': 'Discord',
};

export function Settings(props: SettingsProperties) {
  const [active, setActive] = useState<SettingsTab>(resolveInitialTab(props.tab));
  const [premiumRefreshKey, setPremiumRefreshKey] = useState(0);
  const premium = useContext(PremiumContext);

  const nav = (tab: SettingsTab) => setActive(tab);

  const activeGroup = getParentGroup(active);
  const isSubMenu = activeGroup?.id === active && !!activeGroup?.children?.length;

  const renderPinnedContent = (groupId: SettingsTab) => {
    switch (groupId) {
      case 'General':
        return (
          <Stack gap={30}>
            <GeneralUISettings />
            <GeneralChannelsSection />
          </Stack>
        );
      case 'Chat':
        return <ChatTopSection />;
      case 'Notifications':
        return <NotificationEnableSection />;
      case 'Alerts':
        return <AlertSoundOutputSection />;
      case 'Premium':
        return (
          <Stack key={premiumRefreshKey} gap="md">
            {!premium.isPremium && (
              <>
                <Text>Upgrade to HeheChat Pro to unlock premium features and support the development of HeheChat.</Text>
                <Divider />
              </>
            )}
            <PremiumDetails />
          </Stack>
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
      case 'General/Video': return <GeneralVideoSettings />;
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
      case 'Mod': return <ModSettings />;
      case 'Alerts/Audio': return <AlertsAudioSettings />;
      case 'Alerts/Sharing': return <AlertsSharingSettings />;
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
      case 'Switcher/Provider': return premium.isPremium ? <ProviderConfigTab /> : <PremiumRequired />;
      case 'Switcher/Rules': return premium.isPremium ? <RulesTab /> : <PremiumRequired />;
      case 'Switcher/Tokens': return premium.isPremium ? <TokenTab /> : <PremiumRequired />;
      case 'Premium/Status': return (
        <Stack key={premiumRefreshKey} mt={30} mb={30} gap="md">
          {!premium.isPremium && (
            <>
              <Text>Upgrade to HeheChat Pro to unlock premium features and support the development of HeheChat.</Text>
              <div>
                <Text fw={600} mb="xs">Premium Features:</Text>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Deluxe TTS Voices</li>
                  <li>Push Notifications</li>
                  <li>Read all chat messages</li>
                  <li>Cool HeheChat Badge</li>
                </ul>
              </div>
              <Divider my="sm" />
            </>
          )}
          <PremiumDetails />
        </Stack>
      );
      case 'Premium/Donate': return <DonationPremium />;
      case 'Premium/Redeem': return <RedeemCode onSuccess={() => { setPremiumRefreshKey(k => k + 1); setActive('Premium/Status'); }} />;
      case 'Premium/History': return <Stack mt={30}><Text>Subscription history will be displayed here.</Text></Stack>;
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
        <Title order={4}>Settings — {tabLabels[active] ?? active}</Title>
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
          <ScrollArea h="calc(100vh - 60px)" maw="100%" className={classes.active} scrollbars="y">
            {renderContent()}
          </ScrollArea>
        </div>
      </div>
    </nav>
  );
}
