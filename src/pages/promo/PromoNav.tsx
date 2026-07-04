import { useState, useEffect } from 'react';
import { Box, Flex, Text, Button } from '@mantine/core';
import { HeaderLogo } from '@/components/header/HeaderLogo';
import { BORDER, PINK_GRADIENT } from './tokens';

export interface NavLink { label: string; href: string }
export interface NavCta { label: string; href: string }

interface Props {
  links: NavLink[];
  cta: NavCta;
}

export function PromoNav({ links, cta }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box
      component="nav"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        backgroundColor: scrolled ? 'rgba(0,0,0,0.72)' : 'transparent',
        borderBottom: scrolled ? `1px solid ${BORDER}` : 'none',
        transition: 'background-color 0.3s, border-color 0.3s',
      }}
    >
      <Flex align="center" justify="center" gap={32} py={14} px={24} wrap="nowrap">
        <Box component="a" href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#fff' }}>
          <HeaderLogo size={22} />
        </Box>

        {links.map(({ label, href }) => (
          <Text
            key={label}
            component="a"
            href={href}
            size="sm"
            style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.75)')}
          >
            {label}
          </Text>
        ))}

        <Button
          component="a"
          href={cta.href}
          size="xs"
          style={{ background: PINK_GRADIENT, border: 'none', borderRadius: 20, paddingLeft: 16, paddingRight: 16, fontWeight: 500, fontSize: 13 }}
        >
          {cta.label}
        </Button>
      </Flex>
    </Box>
  );
}
