import { Fragment } from 'react';
import { Box, Text, Title, Button, Flex, AspectRatio } from '@mantine/core';
import { PINK_GRADIENT, TEXT_SECONDARY, gradientText, trackPointer, vars } from './tokens';

export interface HeroButton {
  label: string;
  href: string;
  variant: 'primary' | 'outline';
  icon?: React.ReactNode;
}

interface Props {
  eyebrow: string;
  /** Plain parts + last item rendered in pink gradient */
  headline: string[];
  subline: string;
  buttons: HeroButton[];
  image?: string;
}

// Decorative chat skeleton scrolling behind the headline: [name color, line widths in %] or an alert card
const STREAM: ([string, number[]] | 'alert')[] = [
  ['#9146FF', [80, 45]],
  ['#00C9A7', [60]],
  ['#F26522', [90, 70, 30]],
  'alert',
  ['#29b6ac', [50]],
  ['#ff1493', [75, 40]],
  ['#ffd400', [65]],
  'alert',
  ['#9146FF', [85, 55]],
  ['#00C9A7', [35]],
];

function ChatStream({ side }: { side: 'left' | 'right' }) {
  const msgs = side === 'left' ? STREAM : [...STREAM].reverse();
  return (
    <div className={`p-stream p-stream-${side}`} aria-hidden>
      <div className="p-stream-track">
        {/* doubled so translateY(-50%) loops seamlessly */}
        {[...msgs, ...msgs].map((m, i) =>
          m === 'alert' ? (
            <div key={i} className="p-msg p-msg-alert">
              <div className="p-msg-line" style={{ width: '45%' }} />
              <div className="p-msg-line" style={{ width: '85%' }} />
            </div>
          ) : (
            <div key={i} className="p-msg">
              <div className="p-msg-avatar" style={{ background: m[0] }} />
              <div className="p-msg-lines">
                <div className="p-msg-line" style={{ width: 48, background: m[0] }} />
                {m[1].map((w, j) => <div key={j} className="p-msg-line" style={{ width: `${w}%` }} />)}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function PromoHero({ eyebrow, headline, subline, buttons, image }: Props) {
  const highlighted = headline[headline.length - 1].split(' ');
  const plain = headline.slice(0, -1).join(' ').split(' ');

  return (
    <Box
      component="section"
      onPointerMove={trackPointer}
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}
    >
      <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #120008 0%, #000 45%, #0a0010 100%)', zIndex: 0 }} />
      <div className="p-aurora" aria-hidden>
        <div className="p-blob" />
        <div className="p-blob" />
        <div className="p-blob" />
      </div>
      <div className="p-floor" aria-hidden />
      <ChatStream side="left" />
      <ChatStream side="right" />
      <div className="p-spot" aria-hidden />

      {image && (
        <Box className="p-in" style={vars({ '--d': '1.2s', position: 'absolute', bottom: 0, left: '50%', translate: '-50% 0', width: '80%', maxWidth: 900, zIndex: 1, opacity: 0.35, pointerEvents: 'none' })}>
          <AspectRatio ratio={16 / 9}>
            <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
          </AspectRatio>
        </Box>
      )}

      <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, #000 100%)', zIndex: 2, pointerEvents: 'none' }} />

      <Box className="p-hero-content" style={{ position: 'relative', zIndex: 3, padding: '140px 24px 120px' }}>
        <Text size="sm" fw={600} mb={20} className="p-track" style={{ ...gradientText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {eyebrow}
        </Text>

        <Title order={1} className="p-headline" style={{ fontSize: 'clamp(40px, 7vw, 96px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.035em', color: '#fff', maxWidth: 1100, margin: '0 auto 28px' }}>
          {plain.map((w, i) => (
            <Fragment key={i}>
              <span className="p-word" style={vars({ '--i': i })}>{w}</span>{' '}
            </Fragment>
          ))}
          <br />
          {highlighted.map((w, i) => (
            <Fragment key={i}>
              <span className="p-word" style={vars({ '--i': plain.length + i })}>
                <span className="p-shimmer">{w}</span>
              </span>{' '}
            </Fragment>
          ))}
        </Title>

        <Text size="lg" className="p-in" style={vars({ '--d': '1.1s', color: TEXT_SECONDARY, maxWidth: 560, lineHeight: 1.65, margin: '0 auto 44px' })}>
          {subline}
        </Text>

        <Flex gap={14} justify="center" wrap="wrap" className="p-in" style={vars({ '--d': '1.3s' })}>
          {buttons.map(({ label, href, variant, icon }) =>
            variant === 'primary'
              ? <Button key={label} component="a" href={href} size="lg" leftSection={icon} className="p-btn p-pulse" style={{ background: PINK_GRADIENT, border: 'none', borderRadius: 28, paddingLeft: 32, paddingRight: 32, fontWeight: 600 }}>{label}</Button>
              : <Button key={label} component="a" href={href} size="lg" variant="outline" className="p-btn p-btn-outline" style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 28, paddingLeft: 32, paddingRight: 32, fontWeight: 600 }}>{label}</Button>
          )}
        </Flex>
      </Box>

      <div className="p-cue p-in" style={vars({ '--d': '2s' })} aria-hidden />
    </Box>
  );
}
