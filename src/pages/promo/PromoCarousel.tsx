import { useState, useEffect, useRef } from 'react';
import { Box, Text, Title, Flex, ActionIcon, AspectRatio } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { TEXT_SECONDARY, BORDER, gradientText, vars } from './tokens';

export interface CarouselSlide {
  image?: string;
  video?: string;
  quote?: string;
  author: string;
  channel: string;
}

interface Props {
  eyebrow: string;
  headline: string;
  slides: CarouselSlide[];
  /** Auto-advance interval in ms. Default 6000. */
  interval?: number;
}

export function PromoCarousel({ eyebrow, headline, slides, interval = 5000 }: Props) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = slides.length;

  const go = (next: number) => setIndex(((next % total) + total) % total);

  useEffect(() => {
    timerRef.current = setTimeout(() => go(index + 1), interval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, interval]);

  const slide = slides[index];

  return (
    <Box id="wild" component="section" style={{ background: '#0a0a0a', padding: '120px 24px' }}>
      <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Box className="p-reveal">
          <Text
            ta="center"
            size="sm"
            fw={500}
            mb={12}
            style={{ ...gradientText, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            {eyebrow}
          </Text>
          <Title
            order={2}
            ta="center"
            mb={64}
            style={{
              color: '#fff',
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            {headline}
          </Title>
        </Box>

        {/* Upper: image */}
        <Box
          className="p-tilt"
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${BORDER}`,
            boxShadow: '0 40px 120px rgba(219,50,188,0.12)',
            background: '#000',
          }}
        >
          <AspectRatio ratio={16 / 9} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Box key={index} className="p-media-in">
              {slide.video ? (
                <video
                  src={slide.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.author}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
                  }}
                />
              )}
            </Box>
          </AspectRatio>
        </Box>

        {/* Controls between the two panels */}
        <Flex align="center" justify="space-between" py={24}>
          <ActionIcon
            onClick={() => go(index - 1)}
            variant="subtle"
            size="lg"
            className="p-btn"
            style={{ color: 'rgba(255,255,255,0.5)', borderRadius: '50%' }}
          >
            <IconChevronLeft size={22} />
          </ActionIcon>
          <Flex gap={8} align="center">
            {slides.map((_, i) => (
              <Box
                key={i}
                onClick={() => go(i)}
                className="p-dot"
                style={{
                  width: i === index ? 40 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.2)',
                }}
              >
                {i === index && (
                  <div
                    key={index}
                    className="p-dot-fill"
                    style={vars({ '--dur': `${interval}ms` })}
                  />
                )}
              </Box>
            ))}
          </Flex>
          <ActionIcon
            onClick={() => go(index + 1)}
            variant="subtle"
            size="lg"
            className="p-btn"
            style={{ color: 'rgba(255,255,255,0.5)', borderRadius: '50%' }}
          >
            <IconChevronRight size={22} />
          </ActionIcon>
        </Flex>

        {/* Lower: testimonial */}
        <Box ta="center" style={{ position: 'relative', padding: '24px 40px 0' }}>
          <span className="p-quote-mark" style={gradientText} aria-hidden>
            &ldquo;
          </span>
          <Box key={index} className="p-in" style={{ position: 'relative' }}>
            <Text
              style={{
                color: '#fff',
                fontSize: 'clamp(18px, 2.5vw, 26px)',
                fontWeight: 300,
                lineHeight: 1.5,
                letterSpacing: '-0.01em',
                marginBottom: 20,
                fontStyle: 'italic',
              }}
            >
              "{slide.quote}"
            </Text>
            <Text size="sm" fw={600} style={{ color: TEXT_SECONDARY }}>
              {slide.author}
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {slide.channel}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
