import { Box, Text } from '@mantine/core';
import { HeaderLogo } from '@/components/header/HeaderLogo';
import { BG, BORDER } from './tokens';

interface Props {
  copyright: string;
}

export function PromoFooter({ copyright }: Props) {
  return (
    <Box component="footer" style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '40px 24px', textAlign: 'center' }}>
      <Box style={{ color: '#fff', opacity: 0.4, display: 'inline-block', marginBottom: 16 }}>
        <HeaderLogo size={20} />
      </Box>
      <Text size="xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        © {new Date().getFullYear()} {copyright}
      </Text>
    </Box>
  );
}
