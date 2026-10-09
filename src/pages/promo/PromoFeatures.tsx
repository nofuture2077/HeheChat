import { Box, Text, Title, Button, SimpleGrid } from '@mantine/core';
import { PINK_GRADIENT, gradientText, trackPointer, vars } from './tokens';

import TwitchLogo from '../../res/twitch_logo.svg?react';
import BlerpLogo from '../../res/blerp_logo.svg?react';
import SoundAlertsLogo from '../../res/soundalerts_logo.svg?react';
import StreamElementsLogo from '../../res/streamelement_logo.svg?react';
import HehechatLogo from '../../res/hehechat.svg?react';
import KofiLogo from '../../res/kofi_logo.svg?react';

// Hardcoded scatter — positions & colors chosen for visual balance
const SCATTERED = [
  { Comp: TwitchLogo,        color: '#9146FF', size: 68, top: '48%', left: '8%',   rotate: -14 },
  { Comp: SoundAlertsLogo,   color: '#FF4D6D', size: 52, top: '65%', left: '28%',  rotate:  18 },
  { Comp: KofiLogo,      color: '#DB32BC', size: 80, top: '38%', left: '44%',  rotate:  -6 },
  { Comp: StreamElementsLogo,color: '#F26522', size: 58, top: '60%', left: '63%',  rotate:  22 },
  { Comp: BlerpLogo,         color: '#00C9A7', size: 50, top: '72%', left: '78%',  rotate: -18 },
];

export interface FeatureTileData {
  title: string;
  desc: string;
  dark: boolean;
  bg: string;
  image?: string;
  learnMore?: string;
  scatterLogos?: boolean;
}

function ScatteredLogos() {
  return (
    <>
      {SCATTERED.map(({ Comp, color, size, top, left, rotate }, i) => (
        <Comp
          key={i}
          className="p-float"
          style={{
            ...vars({ '--d': `${i * -1.3}s` }),
            animationDuration: `${5 + i}s`,
            position: 'absolute',
            top,
            left,
            width: size,
            height: size,
            color,
            transform: `rotate(${rotate}deg)`,
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

interface TileProps extends FeatureTileData {
  index: number;
}

function Tile({ title, desc, dark, bg, image, learnMore, scatterLogos, index }: TileProps) {
  const textColor = dark ? '#fff' : '#1d1d1f';
  const subColor = dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)';

  return (
    <Box
      className="p-tile p-reveal"
      onPointerMove={trackPointer}
      style={vars({
        '--i': index % 2,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 460,
        borderRadius: 24,
        backgroundColor: bg,
      })}
    >
      <div
        className="p-tile-bg"
        style={{
          backgroundImage: image
            ? `url(${image})`
            : (!scatterLogos && dark ? `linear-gradient(135deg, #120820 0%, #2a0a3a 50%, #1a0030 100%)` : undefined),
        }}
      />
      {scatterLogos && <ScatteredLogos />}

      <Box style={{ position: 'relative', zIndex: 2, padding: '44px 40px 0', textAlign: 'center' }}>
        <Title order={2} style={{ color: textColor, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>
          {title}
        </Title>
        <Text style={{ color: subColor, fontSize: 15, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>{desc}</Text>
        {learnMore && (
          <Button
            component="a"
            href={learnMore}
            size="xs"
            mt={20}
            className="p-btn"
            style={{ background: PINK_GRADIENT, border: 'none', borderRadius: 20, paddingLeft: 18, paddingRight: 18, fontWeight: 500, fontSize: 13 }}
          >
            Learn more
          </Button>
        )}
      </Box>
    </Box>
  );
}

interface Props {
  eyebrow: string;
  headline: string[];
  tiles: FeatureTileData[];
}

export function PromoFeatures({ eyebrow, headline, tiles }: Props) {
  return (
    <Box id="features" component="section">
      {headline.length > 0 && (
        <Box className="p-reveal" style={{ padding: '120px 24px 56px', textAlign: 'center' }}>
          <Text size="sm" fw={500} mb={12} style={{ ...gradientText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {eyebrow}
          </Text>
          <Title order={2} style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>
            {headline.map((line, i) => <span key={i}>{line}{i < headline.length - 1 && <br />}</span>)}
          </Title>
        </Box>
      )}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={12} style={{ padding: '0 12px 12px' }}>
        {tiles.map((tile, i) => <Tile key={tile.title} index={i} {...tile} />)}
      </SimpleGrid>
    </Box>
  );
}
