import PubSub from 'pubsub-js';
import { parseMessage } from '@/commons/message';
import { pinMessage, unpinMessage } from '@/components/chat/mod/modactions';

// How long /pin waits for the echo of the sent message before giving up
export const PIN_ECHO_TIMEOUT = 10 * 1000;

// Latest native Twitch pin per channel, needed to resolve the message id for /unpin
const currentPins = new Map<string, { channelId: string; messageId: string }>();

PubSub.subscribe(
  'WS-pin',
  (
    _msg: string,
    data: { channel: string; channelId: string; pin: { message_id: string } | null }
  ) => {
    if (!data?.channel) return;
    if (data.pin) {
      currentPins.set(data.channel, { channelId: data.channelId, messageId: data.pin.message_id });
    } else {
      currentPins.delete(data.channel);
    }
  }
);

// Messages are sent through the backend without returning an id, so the message is pinned
// once its echo (same sender, channel and text) arrives in chat. Call before sending.
export const pinOwnMessageOnEcho = (
  channel: string,
  channelId: string,
  userId: string,
  text: string
) => {
  const expected = text.trim();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sub = PubSub.subscribe('WS-msg', (_msg: string, data: { message?: string }) => {
    if (!data?.message) return;
    let message;
    try {
      message = parseMessage(data.message);
    } catch {
      return;
    }
    if (
      message.type !== 'chat' ||
      message.channelId !== channelId ||
      message.userInfo?.userId !== userId ||
      message.text?.trim() !== expected
    ) {
      return;
    }
    PubSub.unsubscribe(sub);
    clearTimeout(timer);
    pinMessage(channel, channelId, message.id);
  });
  timer = setTimeout(() => PubSub.unsubscribe(sub), PIN_ECHO_TIMEOUT);
};

// Returns false when the channel has no known pinned message
export const unpinCurrentMessage = (channel: string) => {
  const pin = currentPins.get(channel);
  if (!pin) return false;
  unpinMessage(channel, pin.channelId, pin.messageId);
  return true;
};
