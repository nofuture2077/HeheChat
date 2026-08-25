import { Box } from '@mantine/core';
import { nav, hero, features, services, pricing, carousel, pwa, faq, footer } from './content';
import { PromoNav } from './PromoNav';
import { PromoHero } from './PromoHero';
import { PromoFeatures } from './PromoFeatures';
import { PromoServices } from './PromoServices';
import { PromoPricing } from './PromoPricing';
import { PromoCarousel } from './PromoCarousel';
import { PromoPwaBanner } from './PromoPwaBanner';
import { PromoFaq } from './PromoFaq';
import { PromoFooter } from './PromoFooter';

export default function PromoPage() {
  return (
    <Box style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
      <style>{`* { box-sizing: border-box; } body { margin: 0; background: #000; } html { scroll-behavior: smooth; } a { color: inherit; }`}</style>
      <PromoNav {...nav} />
      <PromoHero {...hero} />
      <PromoFeatures {...features} />
      <PromoServices {...services} />
      {/* <PromoPricing {...pricing} /> */}
      <PromoCarousel {...carousel} />
      <PromoPwaBanner {...pwa} />
      <PromoFaq {...faq} />
      <PromoFooter {...footer} />
    </Box>
  );
}
