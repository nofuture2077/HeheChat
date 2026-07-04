import { Box, Text, Title } from '@mantine/core';
import { BG, BORDER, gradientText } from './tokens';

import TwitchLogo from '../../res/twitch_logo.svg?react';
import YoutubeLogo from '../../res/youtube_logo.svg?react';
import SevenTvLogo from '../../res/7tv_logo.svg?react';
import StreamElementsLogo from '../../res/streamelement_logo.svg?react';
import SoundAlertsLogo from '../../res/soundalerts_logo.svg?react';
import BlerpLogo from '../../res/blerp_logo.svg?react';
import KofiLogo from '../../res/kofi_logo.svg?react';
import ElevenLabsLogo from '../../res/elevenlabs_logo.svg?react';
import PallyLogo from '../../res/pally_logo.svg?react';

// ponytail: name -> icon lookup, add the svg import + entry here when a new service ships
const LOGOS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Twitch: TwitchLogo,
  YouTube: YoutubeLogo,
  '7TV': SevenTvLogo,
  StreamElements: StreamElementsLogo,
  SoundAlerts: SoundAlertsLogo,
  Blerp: BlerpLogo,
  'Ko-fi': KofiLogo,
  ElevenLabs: ElevenLabsLogo,
  Pally: PallyLogo,
};

export interface ServiceItem { name: string; color: string }

interface Props {
  eyebrow: string;
  headline: string;
  items: ServiceItem[];
}

export function PromoServices({ eyebrow, headline, items }: Props) {
  return (
    <Box id="services" component="section" style={{ background: BG, padding: '100px 24px', borderTop: `1px solid ${BORDER}` }}>
      <Box style={{ textAlign: 'center', marginBottom: 48 }}>
        <Text size="sm" fw={500} mb={12} style={{ ...gradientText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {eyebrow}
        </Text>
        <Title order={2} style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {headline}
        </Title>
      </Box>
      <Box style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32, maxWidth: 720, margin: '0 auto' }}>
        {items.map(({ name, color }) => {
          const Logo = LOGOS[name];
          if (!Logo) return null;
          return (
            <Box key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 100 }}>
              <Logo style={{ width: 40, height: 40, color }} />
              <Text size="xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{name}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
