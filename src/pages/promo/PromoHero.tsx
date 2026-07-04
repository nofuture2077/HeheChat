import { Box, Text, Title, Button, Flex, AspectRatio } from '@mantine/core';
import { PINK_GRADIENT, TEXT_SECONDARY, gradientText } from './tokens';

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

export function PromoHero({ eyebrow, headline, subline, buttons, image }: Props) {
  const highlighted = headline[headline.length - 1];
  const plain = headline.slice(0, -1).join(' ');

  return (
    <Box
      component="section"
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}
    >
      <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #120008 0%, #000 45%, #0a0010 100%)', zIndex: 0 }} />

      <Box style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: 900, zIndex: 1, opacity: 0.35, pointerEvents: 'none' }}>
        <AspectRatio ratio={16 / 9}>
          {image
            ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
            : <Box style={{ background: 'linear-gradient(135deg, #2a0a20 0%, #150010 100%)', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
                Screenshot placeholder
              </Box>
          }
        </AspectRatio>
      </Box>

      <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)', zIndex: 2 }} />

      <Box style={{ position: 'relative', zIndex: 3, padding: '140px 24px 120px' }}>
        <Text size="sm" fw={500} mb={16} style={{ ...gradientText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {eyebrow}
        </Text>

        <Title order={1} style={{ fontSize: 'clamp(36px, 6vw, 76px)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.025em', color: '#fff', maxWidth: 800, marginBottom: 24 }}>
          {plain}{' '}<span style={gradientText}>{highlighted}</span>
        </Title>

        <Text size="lg" style={{ color: TEXT_SECONDARY, maxWidth: 520, lineHeight: 1.65, margin: '0 auto 40px' }}>
          {subline}
        </Text>

        <Flex gap={12} justify="center" wrap="wrap">
          {buttons.map(({ label, href, variant, icon }) =>
            variant === 'primary'
              ? <Button key={label} component="a" href={href} size="md" leftSection={icon} style={{ background: PINK_GRADIENT, border: 'none', borderRadius: 24, paddingLeft: 28, paddingRight: 28, fontWeight: 600 }}>{label}</Button>
              : <Button key={label} component="a" href={href} size="md" variant="outline" style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 24, paddingLeft: 28, paddingRight: 28, fontWeight: 600 }}>{label}</Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
