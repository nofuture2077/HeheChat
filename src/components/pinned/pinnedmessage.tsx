import { Text, Card, Group, ActionIcon, Menu, Image } from '@mantine/core';
import { useState, useEffect, useContext, ReactNode } from 'react';
import { IconEyeOff, IconClockEdit, IconPinnedOff, IconPin } from '@tabler/icons-react';
import { formatMinuteSeconds } from '@/commons/helper';
import { buildEmoteImageUrl } from '@/commons/twitch';
import { ChatEmotesContext, LoginContextContext } from '@/ApplicationContext';
import { updatePin, unpinMessage } from '@/components/chat/mod/modactions';
import pinClasses from './pinmanager.module.css';
import pmClasses from './pinnedmessage.module.css';
import { PinProps } from './pinmanager';

// Helix GET /chat/pins entry, see https://dev.twitch.tv/docs/api/reference/#get-pinned-chat-message
export interface TwitchPinnedMessage {
  message_id: string;
  broadcaster_id: string;
  sender_user_login: string;
  sender_user_name: string;
  pinned_by_user_name: string;
  message: {
    text: string;
    fragments?: { type: string; text: string; emote?: { id: string } | null }[];
  };
  starts_at: string;
  ends_at: string | null;
  updated_at: string;
}

interface PinnedMessageProps extends PinProps {
  pin: TwitchPinnedMessage;
  channelId: string;
}

// Twitch allows 30s to 30min, undefined = until the stream ends
const DURATIONS: { label: string; seconds?: number }[] = [
  { label: '30 seconds', seconds: 30 },
  { label: '1 minute', seconds: 60 },
  { label: '5 minutes', seconds: 300 },
  { label: '10 minutes', seconds: 600 },
  { label: '30 minutes', seconds: 1800 },
  { label: 'Until stream ends' },
];

const renderMessage = (pin: TwitchPinnedMessage): ReactNode => {
  const { fragments } = pin.message;
  if (!fragments?.length) {
    return pin.message.text;
  }
  return fragments.map((f, i) =>
    f.type === 'emote' && f.emote?.id ? (
      <Image
        key={i}
        src={buildEmoteImageUrl(f.emote.id)}
        alt={f.text}
        title={f.text}
        className={pmClasses.emote}
      />
    ) : (
      <span key={i}>{f.text}</span>
    )
  );
};

const secondsLeft = (endsAt: string | null) =>
  endsAt ? Math.round((Date.parse(endsAt) - Date.now()) / 1000) : undefined;

export function PinnedMessage(props: PinnedMessageProps) {
  const emotes = useContext(ChatEmotesContext);
  const login = useContext(LoginContextContext);
  const canManage =
    props.channel === login.user?.name ||
    login.moderatedChannels.some((c) => c.name === props.channel);
  const [remaining, setRemaining] = useState(secondsLeft(props.pin.ends_at));

  useEffect(() => {
    setRemaining(secondsLeft(props.pin.ends_at));
    if (!props.pin.ends_at) {
      return undefined;
    }
    const interval = window.setInterval(() => setRemaining(secondsLeft(props.pin.ends_at)), 1000);
    return () => clearInterval(interval);
  }, [props.pin.ends_at]);

  const { remove } = props;
  useEffect(() => {
    if (remaining !== undefined && remaining < 0) {
      remove();
    }
  }, [remaining, remove]);

  if (remaining !== undefined && remaining < 0) {
    return null;
  }

  const { channel, channelId, pin } = props;

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      ml="sm"
      mr="sm"
      mt={0}
      mb={0}
      onClick={props.onClick}
      className={pmClasses.pinnedMessage}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <span className={pinClasses.logo}>{emotes.getLogo(channel)}</span>
          <IconPin size={18} style={{ flexShrink: 0 }} />
          <Text fw={700} style={{ flexShrink: 0 }}>
            {pin.sender_user_name}:
          </Text>
          <Text className={pmClasses.text} lineClamp={props.expanded ? undefined : 1}>
            {renderMessage(pin)}
          </Text>
        </Group>
        <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
          {remaining !== undefined ? (
            <Text fw={700} mr="xs">
              {formatMinuteSeconds(remaining)}
            </Text>
          ) : null}
          {canManage ? (
            <>
              <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="primary" title="Change pin duration">
                    <IconClockEdit />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Pin for</Menu.Label>
                  {DURATIONS.map((d) => (
                    <Menu.Item
                      key={d.label}
                      onClick={() => updatePin(channel, channelId, pin.message_id, d.seconds)}
                    >
                      {d.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <ActionIcon
                variant="subtle"
                color="primary"
                title="Unpin"
                onClick={() => unpinMessage(channel, channelId, pin.message_id)}
              >
                <IconPinnedOff />
              </ActionIcon>
            </>
          ) : null}
          <ActionIcon variant="subtle" onClick={props.hide} color="primary" title="Hide">
            <IconEyeOff />
          </ActionIcon>
        </Group>
      </Group>
      {props.expanded ? (
        <Text size="xs" c="dimmed" mt={4}>
          Pinned by {pin.pinned_by_user_name}
        </Text>
      ) : null}
    </Card>
  );
}
