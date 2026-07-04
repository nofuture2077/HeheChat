import { ReactNode } from 'react';
import { Box, Text, Title, Accordion, Anchor } from '@mantine/core';
import { BG, BORDER, gradientText } from './tokens';

export interface FaqItem { question: string; answer: string }

// ponytail: supports markdown-style [label](url) links in answers, swap for rich JSX answers if formatting needs grow
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

function linkify(text: string) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = LINK_RE.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <Anchor key={key++} href={match[2]} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
        {match[1]}
      </Anchor>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

interface Props {
  eyebrow: string;
  headline: string;
  items: FaqItem[];
}

export function PromoFaq({ eyebrow, headline, items }: Props) {
  return (
    <Box id="faq" component="section" style={{ background: BG, padding: '100px 24px', borderTop: `1px solid ${BORDER}` }}>
      <Box style={{ maxWidth: 720, margin: '0 auto' }}>
        <Box style={{ textAlign: 'center', marginBottom: 48 }}>
          <Text size="sm" fw={500} mb={12} style={{ ...gradientText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {eyebrow}
          </Text>
          <Title order={2} style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {headline}
          </Title>
        </Box>
        <Accordion variant="separated" styles={{
          item: { background: '#0a0a0a', border: `1px solid ${BORDER}` },
          control: { color: '#fff' },
          label: { fontWeight: 500 },
          panel: { color: 'rgba(255,255,255,0.65)' },
          chevron: { color: '#fff' },
        }}>
          {items.map((item) => (
            <Accordion.Item key={item.question} value={item.question}>
              <Accordion.Control>{item.question}</Accordion.Control>
              <Accordion.Panel style={{ lineHeight: 1.65 }}>{linkify(item.answer)}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Box>
    </Box>
  );
}
