import { Box, Text, Title } from '@mantine/core';
import { BG, BORDER, gradientText, vars } from './tokens';

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

export interface ServiceItem {
  name: string;
  color: string;
}

interface Props {
  eyebrow: string;
  headline: string;
  items: ServiceItem[];
}

function Marquee({ items, reverse }: { items: ServiceItem[]; reverse?: boolean }) {
  const shown = items.filter(({ name }) => LOGOS[name]);
  return (
    <div
      className={reverse ? 'p-marquee p-marquee-rev' : 'p-marquee'}
      aria-hidden={reverse || undefined}
    >
      <div className="p-marquee-track">
        {/* doubled so translateX(-50%) loops seamlessly */}
        {[...shown, ...shown].map(({ name, color }, i) => {
          const Logo = LOGOS[name];
          return (
            <div
              key={i}
              className={i < shown.length ? 'p-chip' : 'p-chip p-dup'}
              style={vars({ '--c': color })}
              aria-hidden={i >= shown.length || undefined}
            >
              <Logo style={{ width: 32, height: 32, color }} />
              <Text fw={500} style={{ color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
                {name}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PromoServices({ eyebrow, headline, items }: Props) {
  return (
    <Box
      id="services"
      component="section"
      style={{ background: BG, padding: '120px 0', borderTop: `1px solid ${BORDER}` }}
    >
      <Box
        className="p-reveal"
        style={{ textAlign: 'center', marginBottom: 24, padding: '0 24px' }}
      >
        <Text
          size="sm"
          fw={500}
          mb={12}
          style={{ ...gradientText, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {eyebrow}
        </Text>
        <Title
          order={2}
          style={{
            color: '#fff',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          {headline}
        </Title>
      </Box>
      <Box
        className="p-reveal"
        style={vars({ '--i': 1, display: 'flex', flexDirection: 'column', marginTop: -28 })}
      >
        <Marquee items={items} />
        <Box style={{ marginTop: -40 }}>
          <Marquee items={[...items].reverse()} reverse />
        </Box>
      </Box>
    </Box>
  );
}
