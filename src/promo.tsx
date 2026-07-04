import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import PromoPage from '@/pages/promo/PromoPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MantineProvider>
    <PromoPage />
  </MantineProvider>
);
