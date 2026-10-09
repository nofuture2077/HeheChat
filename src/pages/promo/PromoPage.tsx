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
import './promo.css';

export default function PromoPage() {
  return (
    <Box className="promo" style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
      <style>{`* { box-sizing: border-box; } body { margin: 0; background: #000; } html { scroll-behavior: smooth; } a { color: inherit; }`}</style>
      <div className="p-progress" aria-hidden />
      <div className="p-grain" aria-hidden />
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
