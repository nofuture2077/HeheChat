import { applyPinnedMessage, Pin } from './pinmanager';
import { TwitchPinnedMessage } from './pinnedmessage';

const twitchPin = (messageId: string, endsAt: string | null = null): TwitchPinnedMessage => ({
  message_id: messageId,
  broadcaster_id: '100',
  sender_user_login: 'viewer',
  sender_user_name: 'Viewer',
  pinned_by_user_name: 'Mod',
  message: { text: 'hello' },
  starts_at: '2026-10-15T12:00:00Z',
  ends_at: endsAt,
  updated_at: '2026-10-15T12:00:00Z',
});

const update = (pin: TwitchPinnedMessage | null, channel = 'streamer') => ({
  channel,
  channelId: '100',
  pin,
});

describe('applyPinnedMessage', () => {
  it('adds a pinned message in front of other pins', () => {
    const other = { id: 'x', type: 'raid', channel: 'streamer' } as Pin;
    const pins = applyPinnedMessage([other], update(twitchPin('m1', '2026-10-15T12:05:00Z')));
    expect(pins).toHaveLength(2);
    expect(pins[0]).toMatchObject({ id: 'message-streamer', type: 'message', hidden: false });
    expect(pins[0].endTime.toISOString()).toBe('2026-10-15T12:05:00.000Z');
    expect(pins[0].data).toEqual({
      pin: twitchPin('m1', '2026-10-15T12:05:00Z'),
      channelId: '100',
    });
  });

  it('keeps hidden state for the same message but shows a newly pinned one', () => {
    const [pin] = applyPinnedMessage([], update(twitchPin('m1')));
    const hidden = [{ ...pin, hidden: true }];
    expect(
      applyPinnedMessage(hidden, update(twitchPin('m1', '2026-10-15T12:05:00Z')))[0].hidden
    ).toBe(true);
    expect(applyPinnedMessage(hidden, update(twitchPin('m2')))[0].hidden).toBe(false);
  });

  it('replaces only the pin of the same channel and removes it on unpin', () => {
    let pins = applyPinnedMessage([], update(twitchPin('m1'), 'a'));
    pins = applyPinnedMessage(pins, update(twitchPin('m2'), 'b'));
    pins = applyPinnedMessage(pins, update(twitchPin('m3'), 'a'));
    expect(pins.map((p) => p.data.pin.message_id)).toEqual(['m2', 'm3']);
    pins = applyPinnedMessage(pins, update(null, 'a'));
    expect(pins.map((p) => p.channel)).toEqual(['b']);
  });

  it('is a no-op when unpinning a channel without pin', () => {
    const pins: Pin[] = [];
    expect(applyPinnedMessage(pins, update(null))).toBe(pins);
  });
});
