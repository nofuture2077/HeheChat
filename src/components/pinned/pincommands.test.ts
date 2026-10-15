import PubSub from 'pubsub-js';
import { pinMessage, unpinMessage } from '@/components/chat/mod/modactions';
import { PIN_ECHO_TIMEOUT, pinOwnMessageOnEcho, unpinCurrentMessage } from './pincommands';

vi.mock('@/components/chat/mod/modactions', () => ({ pinMessage: vi.fn(), unpinMessage: vi.fn() }));

const chat = (id: string, text: string, userId = 'u1', channelId = '100') => ({
  message: JSON.stringify({
    id,
    text,
    parts: [],
    target: '#streamer',
    date: '2026-10-15T12:00:00Z',
    userInfo: { userId },
    channelId,
  }),
});

describe('pin chat commands', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('pins the echo of the own message only', () => {
    pinOwnMessageOnEcho('streamer', '100', 'u1', ' hello world ');
    PubSub.publishSync('WS-msg', chat('a', 'hello world', 'other'));
    PubSub.publishSync('WS-msg', chat('b', 'hello world', 'u1', '200'));
    PubSub.publishSync('WS-msg', chat('c', 'something else'));
    PubSub.publishSync('WS-msg', chat('d', 'hello world'));
    PubSub.publishSync('WS-msg', chat('e', 'hello world'));
    expect(pinMessage).toHaveBeenCalledTimes(1);
    expect(pinMessage).toHaveBeenCalledWith('streamer', '100', 'd');
  });

  it('stops waiting for the echo after the timeout', () => {
    vi.useFakeTimers();
    pinOwnMessageOnEcho('streamer', '100', 'u1', 'late');
    vi.advanceTimersByTime(PIN_ECHO_TIMEOUT);
    PubSub.publishSync('WS-msg', chat('x', 'late'));
    expect(pinMessage).not.toHaveBeenCalled();
  });

  it('unpins the current pin of the channel', () => {
    expect(unpinCurrentMessage('streamer')).toBe(false);
    PubSub.publishSync('WS-pin', {
      channel: 'streamer',
      channelId: '100',
      pin: { message_id: 'm1' },
    });
    expect(unpinCurrentMessage('streamer')).toBe(true);
    PubSub.publishSync('WS-pin', { channel: 'streamer', channelId: '100', pin: null });
    expect(unpinCurrentMessage('streamer')).toBe(false);
    expect(unpinMessage).toHaveBeenCalledTimes(1);
    expect(unpinMessage).toHaveBeenCalledWith('streamer', '100', 'm1');
  });
});
