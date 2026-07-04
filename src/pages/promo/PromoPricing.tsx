import { Box, Text, Title, SimpleGrid, Flex } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { BG, BORDER, PINK_GRADIENT, TEXT_SECONDARY, gradientText } from './tokens';

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  desc: string;
  features: string[];
  highlight?: boolean;
}

interface Props {
  eyebrow: string;
  headline: string;
  tiers: PricingTier[];
}

function Tier({ name, price, period, desc, features, highlight }: PricingTier) {
  return (
    <Box
      style={{
        background: highlight ? 'linear-gradient(135deg, #1a0a14 0%, #120820 100%)' : '#0a0a0a',
        border: highlight ? '1px solid rgba(219,50,188,0.4)' : `1px solid ${BORDER}`,
        borderRadius: 20,
        padding: '36px 32px',
      }}
    >
      <Text fw={600} style={{ color: '#fff', fontSize: 18, marginBottom: 4 }}>{name}</Text>
      <Flex align="baseline" gap={6} mb={8}>
        <Text style={{ ...(highlight ? gradientText : { color: '#fff' }), fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' }}>{price}</Text>
        {period && <Text size="sm" style={{ color: TEXT_SECONDARY }}>{period}</Text>}
      </Flex>
      <Text size="sm" mb={24} style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>{desc}</Text>
      <Flex direction="column" gap={12}>
        {features.map((f) => (
          <Flex key={f} align="center" gap={10}>
            <Box style={{ width: 18, height: 18, borderRadius: '50%', background: highlight ? PINK_GRADIENT : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconCheck size={11} stroke={2.5} color="#fff" />
            </Box>
            <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{f}</Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

export function PromoPricing({ eyebrow, headline, tiers }: Props) {
  return (
    <Box id="pricing" component="section" style={{ background: BG, padding: '100px 24px', borderTop: `1px solid ${BORDER}` }}>
      <Box style={{ maxWidth: 900, margin: '0 auto' }}>
        <Box style={{ textAlign: 'center', marginBottom: 56 }}>
          <Text size="sm" fw={500} mb={12} style={{ ...gradientText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {eyebrow}
          </Text>
          <Title order={2} style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {headline}
          </Title>
        </Box>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={24}>
          {tiers.map((tier) => <Tier key={tier.name} {...tier} />)}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
