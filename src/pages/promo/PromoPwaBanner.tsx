import { Box, Text, Title, Button, Flex } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { BG, BORDER, PINK_GRADIENT, TEXT_SECONDARY, gradientText } from './tokens';

export interface PwaCta { label: string; href: string }

interface Props {
  eyebrow: string;
  headline: string;
  subline: string;
  bullets: string[];
  cta: PwaCta;
}

export function PromoPwaBanner({ eyebrow, headline, subline, bullets, cta }: Props) {
  return (
    <Box id="pwa" component="section" style={{ background: BG, padding: '100px 24px', borderTop: `1px solid ${BORDER}` }}>
      <Box style={{ maxWidth: 800, margin: '0 auto' }}>
        <Box style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a14 100%)', border: '1px solid rgba(219,50,188,0.2)', borderRadius: 24, padding: 'clamp(40px, 6vw, 72px)', textAlign: 'center' }}>
          <Text size="sm" fw={500} mb={12} style={{ ...gradientText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {eyebrow}
          </Text>
          <Title order={2} mb={16} style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {headline}
          </Title>
          <Text style={{ color: TEXT_SECONDARY, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.65 }}>
            {subline}
          </Text>

          <Flex direction="column" gap={12} align="center" mb={40}>
            {bullets.map((text) => (
              <Flex key={text} align="center" gap={10}>
                <Box style={{ width: 20, height: 20, borderRadius: '50%', background: PINK_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconCheck size={12} stroke={2.5} color="#fff" />
                </Box>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{text}</Text>
              </Flex>
            ))}
          </Flex>

          <Button component="a" href={cta.href} size="md" style={{ background: PINK_GRADIENT, border: 'none', borderRadius: 24, paddingLeft: 32, paddingRight: 32, fontWeight: 600 }}>
            {cta.label}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
