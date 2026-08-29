import { describe, it, expect } from 'vitest';
import { shouldPlayTTSText, SmartFilterConfig } from './message';

const filter: SmartFilterConfig = {
    enabled: true,
    skipEmoteOnly: true,
    skipReplies: true,
    skipShort: false,
    minWords: 2,
    skipLong: false,
    maxWords: 40,
    skipLinks: true,
    skipSpam: true
};

describe('shouldPlayTTSText', () => {
    it('blocks a single word repeated many times', () => {
        expect(shouldPlayTTSText('br br br br', 'user1', filter, 0)).toBe(false);
    });

    it('blocks a single character repeated in a run', () => {
        expect(shouldPlayTTSText('aaaaaaaaaa', 'user2', filter, 0)).toBe(false);
    });

    it('blocks a short repeating substring with no word boundaries', () => {
        expect(shouldPlayTTSText('676767676767676767676767676767676767', 'user3', filter, 0)).toBe(false);
    });

    it('blocks a longer repeating substring pattern', () => {
        expect(shouldPlayTTSText('trztrztrztrztrz', 'user4', filter, 0)).toBe(false);
    });

    it('allows a normal sentence', () => {
        expect(shouldPlayTTSText('thanks so much for the sub, love the stream!', 'user5', filter, 0)).toBe(true);
    });

    it('blocks a link when skipLinks is enabled', () => {
        expect(shouldPlayTTSText('check this out https://example.com', 'user6', filter, 0)).toBe(false);
    });

    it('blocks copypasta from a different user within the window', () => {
        expect(shouldPlayTTSText('same message here', 'userA', filter, 1000)).toBe(true);
        expect(shouldPlayTTSText('same message here', 'userB', filter, 1500)).toBe(false);
    });
});
